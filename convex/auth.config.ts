if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error(
    "Missing CLERK_JWT_ISSUER_DOMAIN environment variable. " +
      "See https://docs.convex.dev/auth/clerk#add-the-clerk-issuer-domain-to-your-convex-deployment"
  );
}

const config = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
export default config;
