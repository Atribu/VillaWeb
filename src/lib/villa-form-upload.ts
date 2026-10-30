// XMLHttpRequest exposes real upload progress; fetch does not expose it in browsers.
export function uploadVillaForm(endpoint: string, method: "POST" | "PUT", body: FormData,
  onProgress: (percent: number | null) => void): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, endpoint);
    request.upload.onprogress = (event) => onProgress(event.lengthComputable ? Math.min(100, Math.round(event.loaded / event.total * 100)) : null);
    request.onload = () => {
      if (!request.status) { reject(new Error("Upload connection failed")); return; }
      resolve(new Response(request.status === 204 ? null : request.responseText, { status: request.status, statusText: request.statusText }));
    };
    request.onerror = () => reject(new Error("Upload connection failed"));
    request.onabort = () => reject(new Error("Upload cancelled"));
    request.send(body);
  });
}
