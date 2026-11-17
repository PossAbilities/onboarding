import "server-only";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request } from "node:https";

// SSRF guard for admin-configured webhooks. The app runs in the VPS Docker network beside Supabase,
// so a webhook must never reach a private, loopback, link-local or reserved address. The check runs
// inside the socket's own DNS lookup, so the address checked is the address connected to (no rebinding).
// Ranges mirror workshop-hub's webhook-target.ts (IPv6 is an allow-list: only 2000::/3 global unicast).
const blockedV4 = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) blockedV4.addSubnet(net, bits, "ipv4");

const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
const blockedV6 = new BlockList();
for (const [net, bits] of [
  ["2002::", 16], ["2001::", 23], ["2001:db8::", 32], ["3fff::", 20],
] as const) blockedV6.addSubnet(net, bits, "ipv6");

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !blockedV4.check(ip, "ipv4");
  if (family === 6) return globalV6.check(ip, "ipv6") && !blockedV6.check(ip, "ipv6");
  return false;
}

const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses: LookupAddress[]) => {
    if (err) return callback(err, "", 4);
    if (!addresses.length || !addresses.every((a) => isPublicAddress(a.address))) {
      return callback(new Error("Webhook host resolves to a private address"), "", 4);
    }
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

/** Sends one webhook request and resolves with the HTTP status. Redirects are not followed. */
export function sendWebhook(
  rawUrl: string,
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
  timeoutMs = 10_000,
): Promise<number> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("Webhook URLs must use https");
  if (url.username || url.password) throw new Error("Webhook URLs must not contain credentials");
  if (url.port && url.port !== "443") throw new Error("Webhook URLs must use the standard https port");
  if (isIP(url.hostname.replace(/^\[|\]$/g, ""))) {
    throw new Error("Webhook URLs must use a host name, not an IP address");
  }
  return new Promise((resolve, reject) => {
    const req = request(url, { method, headers, lookup: publicOnlyLookup, timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
    req.end(body);
  });
}
