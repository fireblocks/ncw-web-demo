import config from "./auth_config_sandbox.json";
// import config from "./auth_config_dev9.json";

const onRedirectCallback = (appState: any) => {
  history.pushState(null, "", appState && appState.returnTo ? appState.returnTo : window.location.pathname);
};

export const auth0ProviderConfig = {
  domain: config.domain,
  clientId: config.clientId,
  onRedirectCallback,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: config.audience,
  },
};
