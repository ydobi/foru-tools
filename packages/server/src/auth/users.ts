export type SeedUser = {
  username: string;
  role: 'admin' | 'user';
  passwordHash: string;
};

// bcrypt hashes only — no plaintext passwords in source
export const SEED_USERS: SeedUser[] = [
  {
    username: 'admin',
    role: 'admin',
    passwordHash: '$2b$10$/p0rPLJ6NxmmTxeYzxH/5.5H9VlcciLNK72s79c82h/63Jg3gOLEC',
  },
  {
    username: 'user',
    role: 'user',
    passwordHash: '$2b$10$OW0GYSveD5BtuERzwYMfwuMDWndhX2Ytm8s/E0SFS8QZZUO/ZaOHa',
  },
];
