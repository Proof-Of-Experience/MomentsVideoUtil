import { Request, Response } from "express";

export const getTiktokUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const csrfState = Math.random().toString(36).substring(2);

  let url = "https://www.tiktok.com/v2/auth/authorize/";
  // the following params need to be in `application/x-www-form-urlencoded` format.
  url += "?client_key=aw3hdcl805c2frfa";
  url += "&scope=user.info.basic,user.info.profile,user.info.stats,video.list";
  url += "&response_type=code";
  url += "&redirect_uri=https://be3b-2001-9e8-dc2b-4a00-d478-5925-8136-a75a.ngrok-free.app/auth/tiktok/redirect/";
  url += "&state=" + csrfState;

  res.status(200).json({ url })
};
