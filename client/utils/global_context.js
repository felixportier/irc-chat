import React from 'react';

const GlobalContext = React.createContext({
  user: {},
  channel: {},
  update: (data) => { }
})

export default GlobalContext