import { Builder, Key } from 'selenium-webdriver'
import safari from 'selenium-webdriver/safari.js'
import { readFile, writeFile, readdir, stat, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
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
          await driver.wait(async () => {
            const el = await first()
            const point = await driver.executeScript(function(el) {
              el.scrollIntoView({block:'center',behavior:'instant'})
              const r=el.getBoundingClientRect()
              const x=Math.round(r.x+r.width/2), y=Math.round(r.y+r.height/2)
              if (!el.contains(document.elementFromPoint(x,y))) return null
              window.safariClickSeen = false
              el.addEventListener('click',()=>{window.safariClickSeen=true},{once:true,capture:true})
              return [x,y]
            },el)
            if (!point) return false
            await driver.actions().move({origin:'viewport',x:point[0],y:point[1]}).pause(80).click().perform()
            return driver.executeScript('return window.safariClickSeen')
          }, 5000, 'Safari click: ' + JSON.stringify(steps))
        },
        async fill(value) {
          const el = await first()
          await driver.executeScript("arguments[0].focus(); Object.getOwnPropertyDescriptor(Object.getPrototypeOf(arguments[0]),'value').set.call(arguments[0],arguments[1]); arguments[0].dispatchEvent(new Event('input',{bubbles:true})); arguments[0].dispatchEvent(new Event('change',{bubbles:true}));",el,value)
        },
        async setInputFiles(file) {
          const bytes = await readFile(file)
          const name = basename(file)
          const type = name.endsWith('.csv') ? 'text/csv' : 'application/json'
          // Transfer the same fixture bytes into the real file input on the browser host.
          // Hosted Safari cannot read files from the runner process's temporary directory.
          await driver.executeScript(function(input, encoded, name, type) {
            const transfer = new DataTransfer()
            const bytes = Uint8Array.from(atob(encoded), ch => ch.charCodeAt(0))
            transfer.items.add(new File([bytes], name, {type}))
            input.files = transfer.files
            input.dispatchEvent(new Event('input', {bubbles:true}))
            input.dispatchEvent(new Event('change', {bubbles:true}))
          }, await first(), bytes.toString('base64'), name, type)
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
