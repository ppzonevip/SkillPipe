import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, incrementUsage, writeRequestLog } from "@/lib/gateway";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { slug } = await params;
  const apiKey = req.headers.get("x-api-key") || "";

  // Validate the API key
  const validation = await validateApiKey(apiKey);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.errorCode }
    );
  }

  const keyData = validation.apiKey!;

  // Find the skill by slug
  const skill = await prisma.skill.findFirst({
    where: {
      customSlug: slug,
      isActive: true,
    },
  });

  if (!skill) {
    return NextResponse.json(
      { error: "Skill not found" },
      { status: 404 }
    );
  }

  // Check if the API key belongs to this skill
  if (keyData.skillId !== skill.id) {
    return NextResponse.json(
      { error: "Invalid API Key for this endpoint" },
      { status: 403 }
    );
  }

  // Get request details
  const method = req.method;
  const requestPath = req.nextUrl.pathname;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    // Build the target URL
    const targetUrl = new URL(skill.targetUrl);
    const requestUrl = new URL(req.url);
    targetUrl.pathname = requestUrl.pathname.replace(`/api/gateway/${slug}`, targetUrl.pathname);
    targetUrl.search = requestUrl.search;

    // Prepare headers for the upstream request
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Don't forward host, keep original headers except auth-related
      if (!["host", "x-api-key", "x-request-id"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Add request ID
    const requestId = crypto.randomUUID();
    headers.set("X-Request-Id", requestId);

    // Forward the request
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method,
      headers,
      body: method !== "GET" && method !== "HEAD" ? req.body : undefined,
      duplex: "half",
    } as RequestInit);

    // Calculate duration
    const duration = Date.now() - startTime;

    // Log the request (non-blocking)
    writeRequestLog({
      apiKeyId: keyData.id,
      skillId: skill.id,
      userId: keyData.userId,
      method,
      path: requestPath,
      statusCode: upstreamResponse.status,
      duration,
      ip,
    });

    // Increment usage (non-blocking)
    incrementUsage(keyData.id);

    // Build response with rate limit headers
    const remainingQuota = keyData.totalQuota > 0
      ? keyData.totalQuota - keyData.usedQuota - 1
      : -1;

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("X-Request-Id", requestId);
    if (remainingQuota >= 0) {
      responseHeaders.set("X-RateLimit-Remaining", remainingQuota.toString());
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("Gateway proxy error:", error);

    // Log failed request (non-blocking)
    writeRequestLog({
      apiKeyId: keyData.id,
      skillId: skill.id,
      userId: keyData.userId,
      method,
      path: requestPath,
      statusCode: 502,
      errorMsg: error instanceof Error ? error.message : "Upstream Error",
      duration: Date.now() - startTime,
      ip,
    });

    return NextResponse.json(
      { error: "Upstream Error" },
      { status: 502 }
    );
  }
}

// Also handle GET requests
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  return POST(req, { params } as any);
}
