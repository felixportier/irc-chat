import '../styles.css'
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { config } from '@fortawesome/fontawesome-svg-core'
import '../node_modules/@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false
import GlobalContext from '../utils/global_context';


function MyApp({ Component, pageProps }) {
  const [state, setState] = useState({
    currentChannel:{
      channelName:'',
    },
    user:{
      userName:'',
    },
    update
  })

  function update(data) {
    setState(Object.assign({}, state, data));
  }

  return (
    <GlobalContext.Provider value={state}>
      <Component {...pageProps} />
    </GlobalContext.Provider>
  )
}

export default MyApp