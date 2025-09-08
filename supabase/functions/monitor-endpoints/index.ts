// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

async function probe(url: string, method: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: "follow",
      headers: { "cache-control": "no-store" },
    });
    const latency = Date.now() - started;
    return {
      status: res.ok && res.status < 400 ? "up" : "down",
      statusCode: res.status,
      latency,
      error: undefined as string | undefined,
    } as const;
  } catch (e: any) {
    const latency = Date.now() - started;
    const isAbort = e?.name === "AbortError";
    return {
      status: "down" as const,
      statusCode: undefined,
      latency,
      error: isAbort ? `timeout in ${timeoutMs}ms` : String(e?.message || e),
    };
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    const { id } = req.method !== "GET" ? await req.json().catch(() => ({})) : Object.fromEntries(new URL(req.url).searchParams);

    // Select endpoints to check
    let endpointsQuery = supabase.from("endpoints").select("*").eq("enabled", true);

    if (id) {
      endpointsQuery = endpointsQuery.eq("id", id as string);
    } else {
      // Only endpoints due for check based on interval
      // last_checked_at IS NULL OR last_checked_at <= now() - interval_sec seconds
      const { data: due, error: dueError } = await supabase
        .from("endpoints")
        .select("*")
        .eq("enabled", true);
      if (dueError) throw dueError;

      // Filter in memory using interval logic to avoid SQL complexity
      const now = Date.now();
      const toCheck = (due || []).filter((ep: any) => {
        if (!ep.last_checked_at) return true;
        const last = new Date(ep.last_checked_at).getTime();
        return now - last >= (Math.max(5, ep.interval_sec || 60) * 1000);
      });

      // If no one is due, return early
      if (!id && toCheck.length === 0) {
        return new Response(JSON.stringify({ ok: true, checked: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Overwrite query result path by using local list
      // We will process toCheck directly
      const results = await Promise.all(
        toCheck.map(async (ep: any) => {
          const timeoutMs = Math.min(Math.max(ep.interval_sec * 1000 - 500, 3000), 15000);
          const r = await probe(ep.url, ep.method || "GET", timeoutMs);

          // detect change
          const changed = ep.last_status && ep.last_status !== r.status;

          // update DB
          const { error: upErr } = await supabase
            .from("endpoints")
            .update({
              last_status: r.status,
              last_status_code: r.statusCode ?? null,
              last_latency_ms: r.latency,
              last_checked_at: new Date().toISOString(),
              error: r.error || null,
            })
            .eq("id", ep.id);
          if (upErr) console.error("update error", upErr);

          // webhook on change
          if (changed && ep.webhook_url) {
            try {
              await fetch(ep.webhook_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "endpoint_status_changed",
                  occurred_at: new Date().toISOString(),
                  endpoint: { id: ep.id, url: ep.url, method: ep.method },
                  previous: ep.last_status,
                  current: r.status,
                }),
              });
            } catch (we) {
              console.warn("webhook error", we);
            }
          }

          return { id: ep.id, ...r };
        })
      );

      return new Response(JSON.stringify({ ok: true, checked: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we reach here with an id, fetch that single endpoint
    const { data: one, error } = await endpointsQuery.single();
    if (error || !one) {
      return new Response(JSON.stringify({ ok: false, error: error?.message || "Endpoint not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timeoutMs = Math.min(Math.max(one.interval_sec * 1000 - 500, 3000), 15000);
    const r = await probe(one.url, one.method || "GET", timeoutMs);
    const changed = one.last_status && one.last_status !== r.status;

    const { error: upErr } = await supabase
      .from("endpoints")
      .update({
        last_status: r.status,
        last_status_code: r.statusCode ?? null,
        last_latency_ms: r.latency,
        last_checked_at: new Date().toISOString(),
        error: r.error || null,
      })
      .eq("id", one.id);
    if (upErr) console.error("update error", upErr);

    if (changed && one.webhook_url) {
      try {
        await fetch(one.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "endpoint_status_changed",
            occurred_at: new Date().toISOString(),
            endpoint: { id: one.id, url: one.url, method: one.method },
            previous: one.last_status,
            current: r.status,
          }),
        });
      } catch (we) {
        console.warn("webhook error", we);
      }
    }

    return new Response(JSON.stringify({ ok: true, result: { id: one.id, ...r } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("monitor-endpoints error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
