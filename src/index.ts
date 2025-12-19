import * as line from "@line/bot-sdk";
import assert from "assert";
import express from "express";
import http from "node:http";
import { env } from "process";

/**
 * グループに入った時に送られる挨拶
 */
const GREETING = "カラキンだよ！";

/**
 * stringを返すとその内容が返信される。
 * undefinedを返すか何も返さないと何も返信しない。
 */
function createReply(message: string): string | undefined {
  if (message === "カラ") {
    return "キン";
  }
}

// 以下はLINEボットを動かすための色々ややこしいところ

const { MessagingApiClient } = line.messagingApi;

async function handleEvent(
  client: line.messagingApi.MessagingApiClient,
  event: line.WebhookEvent,
): Promise<void> {
  if (event.type === "join") {
    if (event.source.type === "group" || event.source.type === "room") {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: GREETING }],
      });
      console.log("グループに参加しました");
    }
  } else if (event.type === "message" && event.message.type === "text") {
    const reply = createReply(event.message.text);
    if (reply !== undefined) {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: reply }],
      });
      console.log(
        `メッセージ「${event.message.text}」に「${reply}」と返信しました`,
      );
    } else {
      console.log(`メッセージ「${event.message.text}」を無視しました`);
    }
  }
}

function main(): void {
  const channelSecret = env.CHANNEL_SECRET;
  const channelAccessToken = env.CHANNEL_ACCESS_TOKEN;
  assert(channelSecret !== undefined && channelAccessToken !== undefined);
  const port = 21153;

  const client = new MessagingApiClient({ channelAccessToken });

  const app = express();
  app.post("/", line.middleware({ channelSecret }), (req, res) => {
    // The middleware takes care of parsing the request body
    const { events } = req.body as { events: line.WebhookEvent[] };
    res.sendStatus(200);
    for (const event of events) {
      handleEvent(client, event).catch((err) => console.error(err));
    }
  });
  const httpServer = http.createServer(app);
  httpServer.listen({ port }, () =>
    console.log(`ポート${port}でサーバーを起動しました`),
  );
}

main();
