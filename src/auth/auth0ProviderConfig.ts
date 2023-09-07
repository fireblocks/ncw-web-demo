import { ENV_CONFIG } from "../env_config";

const onRedirectCallback = (appState: any) => {
  history.pushState(null, "", appState && appState.returnTo ? appState.returnTo : window.location.pathname);
};

export const auth0ProviderConfig = {
  domain: ENV_CONFIG.AUTH0_DOMAIN,
  clientId: ENV_CONFIG.AUTH0_CLIENT_ID,
  onRedirectCallback,
  authorizationParams: {
    redirect_uri: new URL('/ncw-web-demo/', window.location.origin),
    audience: ENV_CONFIG.AUTH0_AUDIENCE,
  },
};
