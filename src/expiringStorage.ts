export const get = (key: string) => {
  const item = localStorage.getItem(key);

  if (item === null) {
    return null;
  }

  const cached = JSON.parse(item);

  if (!cached) {
    return null;
  }

  const expires = new Date(cached.expires);

  if (expires < new Date()) {
    localStorage.removeItem(key);
    return null;
  }

  return cached.value;
};

export const set = (key: string, value: any, lifeTimeInMinutes: number) => {
  const currentTime = new Date().getTime();

  const expires = new Date(currentTime + (lifeTimeInMinutes * 60000));

  localStorage.setItem(key, JSON.stringify({ value, expires }));
};
