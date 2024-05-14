import IMAPSettingsDetector from "../dist/index.mjs";

(async () => {
  const detector = new IMAPSettingsDetector();
  
  
  const freeshell = await detector.detect("malek@freeshell.de", 'testtest1');
  console.log("freeshell: ", freeshell);
  
  const gmail = await detector.detect("malek@gmail.com");
  console.log("gmail: ", gmail);

  const yahoo = await detector.detect("malek@yahoo.com");
  console.log("yahoo: ", yahoo);
  
  const outlook = await detector.detect("malek@outlook.com");
  console.log("outlook: ", outlook);
  
  const gandi = await detector.detect("malek@gandi.net");
  console.log("gandi: ", gandi);
})();
