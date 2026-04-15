import { boot } from 'quasar/wrappers'

const REF_RESERVED_WARN = 'Invalid prop name: "ref" is a reserved property.'

export default boot(({ app }) => {
  const previousWarnHandler = app.config.warnHandler

  app.config.warnHandler = (msg, instance, trace) => {
    if (typeof msg === 'string' && msg.includes(REF_RESERVED_WARN)) {
      return
    }

    if (typeof previousWarnHandler === 'function') {
      previousWarnHandler(msg, instance, trace)
    }
  }
})
