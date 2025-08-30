import mammoth from "mammoth";
import fs from "fs";

async function convert() {
  const docxPath = "data/300 Questions Stations with script and assessment.docx";
  const outputPath = "data/questions.json";

  const { value } = await mammoth.extractRawText({ path: docxPath });
  const lines = value.split("\n").map(l => l.trim()).filter(l => l);

  const stations = [];
  let current = null;

  for (const line of lines) {
    if (line.toLowerCase().includes("station")) {
      // Start a new station
      if (current) stations.push(current);
      current = {
        id: stations.length + 1,
        station: line,
        candidate: "",
        roleplayer: "",
        script: {}
      };
    } else if (line.toLowerCase().startsWith("candidate")) {
      current.candidate = line.replace(/^Candidate.*?:\s*/i, "");
    } else if (line.toLowerCase().startsWith("role player")) {
      current.roleplayer = line.replace(/^Role Player.*?:\s*/i, "");
    } else if (line.toLowerCase().startsWith("script")) {
      // mark script start
    } else if (line.toLowerCase().startsWith("opening")) {
      current.script.opening = line.replace(/^Opening.*?:\s*/i, "");
    } else if (line.toLowerCase().includes("mood")) {
      current.script.mood = line.replace(/^.*?:\s*/i, "");
    } else if (line.toLowerCase().includes("sleep")) {
      current.script.sleep = line.replace(/^.*?:\s*/i, "");
    } else if (line.toLowerCase().includes("appetite")) {
      current.script.appetite = line.replace(/^.*?:\s*/i, "");
    } else if (line.toLowerCase().includes("guilt")) {
      current.script.guilt = line.replace(/^.*?:\s*/i, "");
    }
  }

  if (current) stations.push(current);

  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));
  console.log(`✅ Conversion complete. Saved ${stations.length} stations to ${outputPath}`);
}

convert().catch(err => console.error(err));
