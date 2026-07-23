async function test() {
  const res = await fetch("https://api.svt.se/texttv/100");

  if (!res.ok) {
    console.log("API error:", res.status);
    return;
  }

  const data = await res.json();
  console.log(data);
}

test();