import { boot } from 'quasar/wrappers'
import NutUI from '@nutui/nutui'
import '@nutui/nutui/dist/style.css'

export default boot(({ app }) => {
  app.use(NutUI)
})
