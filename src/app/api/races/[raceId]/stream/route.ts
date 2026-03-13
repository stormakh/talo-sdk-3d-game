import { raceEmitter, type RaceEvent } from "@/lib/race-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> }
) {
  const { raceId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const channel = `race:${raceId}`;

      const listener = (event: RaceEvent) => {
        const data = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        raceEmitter.off(channel, listener);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      raceEmitter.on(channel, listener);
      request.signal.addEventListener("abort", cleanup);

      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ raceId })}\n\n`
        )
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
