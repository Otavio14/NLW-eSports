import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { convertHourStringToMinutes } from "./utils/convert-hour-string-to-minutes";
import { convertMinutesToHourString } from "./utils/convert-minutes-to-hour-string";

const app = express();

app.use(express.json());

app.use(cors());

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["query"],
});

app.get(`/games`, async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return response.json(games);
});

app.post(`/games/:id/ads`, async (request, response) => {
  const gameId = request.params.id;
  const body: any = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(","),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    },
  });

  return response.status(201).json(ad);
});

app.get(`/games/:id/ads`, async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return response.json(
    ads.map((ad: { weekDays: string; hourStart: number; hourEnd: number }) => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(","),
        hourStart: convertMinutesToHourString(ad.hourStart),
        hourEnd: convertMinutesToHourString(ad.hourEnd),
      };
    })
  );
});

app.get(`/ads/:id/discord`, async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  return response.json({ discord: ad.discord });
});

const create = async () => {
  await prisma.game.createMany({
    data: [
      {
        id: "a9542d31-6cb0-4953-8122-a88b724435bc",
        title: "League of Legends",
        bannerUrl: "https://static-cdn.jtvnw.net/ttv-boxart/21779-285x380.jpg",
      },
      {
        id: "a9aafd88-2c4c-40a4-b2a5-faf0d4c41207",
        title: "CS:GO",
        bannerUrl:
          "https://static-cdn.jtvnw.net/ttv-boxart/32399_IGDB-285x380.jpg",
      },
      {
        id: "d4d3d441-efc6-4105-a3b8-9a7cf2224429",
        title: "Dota 2",
        bannerUrl: "https://static-cdn.jtvnw.net/ttv-boxart/29595-285x380.jpg",
      },
      {
        id: "7f887d8e-16df-4771-8a33-6d8181754827",
        title: "World of Warcraft",
        bannerUrl: "https://static-cdn.jtvnw.net/ttv-boxart/18122-285x380.jpg",
      },
      {
        id: "d8f3319c-46de-4ebb-a71d-87cd3a0e0e3b",
        title: "Apex Legends",
        bannerUrl: "https://static-cdn.jtvnw.net/ttv-boxart/511224-285x380.jpg",
      },
      {
        id: "af6a6aae-0a27-44c8-9d20-aa84a5294d9e",
        title: "F1 2022",
        bannerUrl:
          "https://static-cdn.jtvnw.net/ttv-boxart/1705795372_IGDB-285x380.jpg",
      },
    ],
  });
};

app.listen(3333, () => {
  console.log("Server is running on port 3333");
});
