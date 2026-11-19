import { Builder, Key } from 'selenium-webdriver'
import safari from 'selenium-webdriver/safari.js'
import { readFile, writeFile, readdir, stat, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const library = await readFile(require.resolve('@testing-library/dom/dist/@testing-library/dom.umd.min.js'), 'utf8')

export async function launchSafari() {
  const service = new safari.ServiceBuilder('/usr/bin/safaridriver').build()
  let driver
  try {
    driver = await new Builder().disableEnvironmentOverrides().usingServer(await service.start()).forBrowser('safari').build()
  } catch (err) { await service.kill(); throw err }

  async function newPage({viewport}) {
    const [dx, dy] = await driver.executeScript('return [outerWidth-innerWidth,outerHeight-innerHeight]')
    await driver.manage().window().setRect({x:0,y:0,width:viewport.width+dx,height:viewport.height+dy})
    function selector(steps) {
      async function matches() {
        return driver.executeScript(function (steps) {
          let roots = [document.body]
          for (const {type, value, regexp, exact} of steps) {
            const name = regexp ? new RegExp(value) : value
            if (type === 'first') { roots = roots.slice(0,1); continue }
            roots = roots.flatMap(root => {
              if (type === 'css') return [...(root === document.body ? document : root).querySelectorAll(value)]
              if (type === 'label') return TestingLibraryDom.queryAllByLabelText(root,name,{exact})
              if (type === 'text') return TestingLibraryDom.queryAllByText(root,name,{exact})
              return TestingLibraryDom.queryAllByRole(root,type,{name})
            })
          }
          return roots
        }, steps)
      }
      const first = async () => driver.wait(async () => (await matches())[0], 5000)
      return {
        ...queries(steps), first: () => selector([...steps,{type:'first'}]),
        async click() {
          const el = await first()
          await driver.wait(() => driver.executeScript(function(el) {
            el.scrollIntoView({block:'center',behavior:'instant'})
            const r=el.getBoundingClientRect()
            return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))
          },el),5000)
          const rect = await driver.executeScript(function(el) {
            const r=el.getBoundingClientRect()
            return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]
          },el)
          await driver.actions().move({origin:'viewport',x:rect[0],y:rect[1]}).click().perform()
        },
        async fill(value) {
          const el = await first()
          await driver.executeScript("arguments[0].focus(); Object.getOwnPropertyDescriptor(Object.getPrototypeOf(arguments[0]),'value').set.call(arguments[0],arguments[1]); arguments[0].dispatchEvent(new Event('input',{bubbles:true})); arguments[0].dispatchEvent(new Event('change',{bubbles:true}));",el,value)
        },
        async setInputFiles(file) {
          const input = await first()
          await driver.executeScript(function(input) {
            window.importRead = {received:false}
            input.addEventListener('change', async () => {
              const f = input.files[0]
              try { window.importRead = {name:f?.name, size:f?.size, bytes:(await f.arrayBuffer()).byteLength} }
              catch (error) { window.importRead = {name:f?.name, error:String(error)} }
            }, {once:true,capture:true})
          }, input)
          await input.sendKeys(file)
          const report = await driver.wait(async () => {
            const result = await driver.executeScript('return window.importRead')
            return result.name && result
          }, 15000, 'Safari did not select the test input')
          if (report.error || report.bytes !== (await stat(file)).size) throw new Error('Safari could not read test file: '+JSON.stringify(report))
        },
        count: async () => (await matches()).length,
        textContent: async () => (await first()).getProperty('textContent'),
        allTextContents: async () => Promise.all((await matches()).map(el => el.getProperty('textContent'))),
        getAttribute: async name => (await first()).getAttribute(name),
        evaluate: async fn => driver.executeScript(fn, await first()),
        isVisible: async () => (await first()).isDisplayed(),
        async waitFor({state='visible',timeout=5000}={}) {
          await driver.wait(async () => {
            try {
              const el = (await matches())[0]
              return Boolean(el && await el.isDisplayed()) === (state !== 'hidden')
            } catch (error) {
              if (error.name !== 'StaleElementReferenceError') throw error
              return false
            }
          }, timeout, JSON.stringify(steps))
        }
      }
    }
    function queries(steps) {
      function append(type, name, exact=true) {
        return selector([...steps,{type,value:name instanceof RegExp ? name.source : name,regexp:name instanceof RegExp,exact}])
      }
      return { locator: css => append('css',css), getByRole: (role,{name}) => append(role,name), getByText: (text,opts) => append('text',text,opts?.exact), getByLabel: label => append('label',label) }
    }
    return {
      ...queries([]), evaluate: (fn,...args) => driver.executeScript(fn,...args),
      async goto(url) {
        await driver.get(url)
        await driver.executeScript('localStorage.clear(); sessionStorage.clear()')
        await driver.navigate().refresh()
        await driver.executeScript(library)
      },
      screenshot: async ({path}) => writeFile(path, Buffer.from(await driver.takeScreenshot(),'base64')),
      waitForTimeout: delay,
      keyboard: { press: async key => driver.actions().sendKeys(key==='Escape'?Key.ESCAPE:key).perform() },
      mouse: {click: (x,y) => driver.actions().move({x:Math.round(x),y:Math.round(y)}).click().perform()}
    }
  }
  return {newPage, async close() { try { await driver.quit() } finally { await service.kill() } }}
}

// Safari saves downloads outside the WebDriver session. Only accept files created by this action.
export async function watchDownload(page, extension) {
  const prefix = 'overlook-test-' + randomUUID() + '-'
  await page.evaluate(token => {
    const proto = HTMLAnchorElement.prototype
    const descriptor = window.originalDownloadDescriptor ??= Object.getOwnPropertyDescriptor(proto,'download')
    Object.defineProperty(proto, 'download', {
      ...descriptor,
      set(filename) { descriptor.set.call(this, token + filename) }
    })
  }, prefix)
  const dir = join(homedir(), 'Downloads')
  return async () => {
    for (let n=0; n<200; n++) {
      const filename = (await readdir(dir)).find(name => name.startsWith(prefix) && name.endsWith(extension))
      if (filename && (await stat(join(dir,filename))).size > 0) {
        await unlink(join(dir,filename))
        return filename.slice(prefix.length)
      }
      await delay(100)
    }
    throw new Error('Safari download did not finish: ' + extension)
  }
}
