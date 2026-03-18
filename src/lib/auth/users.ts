export type AppRole = "ADMIN" | "STAFF";

export type AppUser = {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
  password: string;
};

const users: AppUser[] = [
  {
    id: "seed-admin-1",
    username: process.env.ADMIN_USERNAME ?? "admin",
    displayName: "Sistem Admini",
    role: "ADMIN",
    password: process.env.ADMIN_PASSWORD ?? "VillaAdmin2026!",
  },
  {
    id: "seed-staff-1",
    username: process.env.STAFF_USERNAME ?? "villa-personel",
    displayName: "Villa Personeli",
    role: "STAFF",
    password: process.env.STAFF_PASSWORD ?? "VillaStaff2026!",
  },
];

export const loginCredentials = users.map((user) => ({
  username: user.username,
  password: user.password,
  displayName: user.displayName,
  role: user.role,
}));

export function validateUser(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();

  const user = users.find(
    (item) =>
      item.username.trim().toLowerCase() === normalizedUsername && item.password === password,
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}
