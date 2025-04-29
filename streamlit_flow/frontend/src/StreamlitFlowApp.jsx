import {
    withStreamlitConnection
} from "streamlit-component-lib"

import StreamlitFlowComponent from "./StreamlitFlowComponent";


// index.js or App.js (top-level component)

window.onerror = function (message, source, lineno, colno, error) {
    console.error("Global Error:", { message, source, lineno, colno, error });
    // return true to indicate you've handled the error (prevents propagation)
    return true;
  };
  
  window.onunhandledrejection = function (event) {
    console.error("Unhandled Promise rejection:", event.reason);
    // prevent default handling (optional)
    event.preventDefault();
  };
  

const StreamlitFlowApp = (props) => {

    return <>
        {props.args.component === 'streamlit_flow' && <StreamlitFlowComponent {...props} />}
    </>;
} 

export default withStreamlitConnection(StreamlitFlowApp);