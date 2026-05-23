export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Nao foi possivel ler o arquivo selecionado."));
        return;
      }

      const [, base64Content = ""] = result.split(",");
      resolve(base64Content);
    };

    reader.onerror = () =>
      reject(new Error("Nao foi possivel ler o arquivo selecionado."));

    reader.readAsDataURL(file);
  });
}
