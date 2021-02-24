interface Config {
  baseUrl: string;
  cookieSecret: string;
  oidcDiscoveryUrl: string;
  oidcClientId: string;
  oidcSecret: string;
}
type EnvMap = { [key in keyof Config]: string };

const envMap: EnvMap = {
  baseUrl: "BASE_URL",
  cookieSecret: "COOKIE_SECRET",
  oidcDiscoveryUrl: "OIDC_DISCOVERY_URL",
  oidcClientId: "OIDC_CLIENT_ID",
  oidcSecret: "OIDC_SECRET",
};

const config: Config = (() => {
  let c: Partial<Config> = {};
  for (const [key, env] of Object.entries(envMap)) {
    const val = process.env[env];
    if (!val || val === "") {
      throw new Error(`Environment variable ${env} must be defined.`);
    }
    c[key as keyof Config] = val;
  }
  return c as Config;
})();

export default config;
