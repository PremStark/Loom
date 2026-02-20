import puter from "@heyputer/puter.js";
import {HOSTING_CONFIG_KEY} from "./utils";

type HostingConfig = { subdomain: string; };
type HostedAsset = { url: string; };

export const getOrCreateHostingConfig = async ():Promise<HostingConfig | null> => {
    const existing = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;

    if(existing?.subdomain) return { subdomain: existing.subdomain };

    const subdomain = createHostingSlug();

}