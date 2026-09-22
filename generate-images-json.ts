import * as fs from "node:fs/promises";
const jsonPath = "./main/images.json";
const imagesPath = "./main/images";

const files = await fs.readdir(imagesPath);
const jsonData = {} as Record<string, string>;
for (const file of files) {
  const filePath = `${imagesPath}/${file}`;
  const fileStat = await fs.stat(filePath);
  if (fileStat.isFile()) {
    // get data url equivalent
    const fileData = await fs.readFile(filePath);
    let ext = file.split(".")[1];
    if (ext !== "svg") continue;
    ext = "svg+xml";
    const dataUrl = `data:image/${ext};base64,${fileData.toString("base64")}`;
    jsonData["images/" + file] = dataUrl;
  }
}
await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
