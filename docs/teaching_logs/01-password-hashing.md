# Lesson 01: Password Hashing — What Happens Behind the Scenes

**Date:** 2026-02-08
**Phase:** 7 (User Authentication)
**Prior knowledge:** Student used `has_secure_password` in Rails/bcrypt. Knows passwords get hashed. Didn't know the internals.

---

## Concepts Covered

### Hashing vs Encryption
- Hashing is **one-way** (irreversible). Encryption is **two-way** (reversible with a key).
- You can't "decrypt" a hash — there's no key. The math only goes one direction.
- Encryption would be dangerous: if someone gets the key, they get every password.

### Why Hash?
- Store the hash, not the password. On login, hash the attempt and compare.
- If the database is stolen, the attacker gets hashes — not passwords.

### The Salt
- **Problem:** Without a salt, the same password always produces the same hash. Attackers precompute hashes for common passwords (rainbow tables) and look them up instantly.
- **Solution:** Generate 16 random bytes (salt), mix with password before hashing. Now `"hello123"` + `salt_A` ≠ `"hello123"` + `salt_B`.
- **Key insight:** The salt is stored in plain text next to the hash. It doesn't need to be secret — its job is to make rainbow tables useless by ensuring each hash is unique.

### Bcrypt Hash Format
```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 ^^  ^^  ^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 |   |   salt (22 chars)        hash (31 chars)
 |   cost factor (2^10 = 1,024 rounds)
 algorithm version ($2b)
```

### Cost Factor (Salt Rounds)
- The `10` in `bcrypt.hash(password, 10)` means 2^10 = 1,024 rounds of the internal algorithm.
- Bcrypt is **intentionally slow** — SHA-256 hashes millions/sec (easy to brute force), bcrypt takes ~100ms per hash.
- As computers get faster, increase the cost factor (12, 14, etc.) to keep it slow.

### Modern Alternatives (OWASP Recommendations)
1. **Argon2id** — First choice today. Resists GPU and memory-based attacks. Won 2015 Password Hashing Competition.
2. **scrypt** — When Argon2 isn't available.
3. **bcrypt** — Still acceptable. Has a 72-byte password limit.
- We use bcrypt because it's simple and great for learning. Argon2id is where the industry is headed.

### Why Not Encrypt?
- Encryption is reversible — if the attacker gets the key, every password is exposed.
- Hashing only needs to **verify** (does this match?), never **recover** (what was the original?).

---

## Questions & Student Responses

**Q: What do you think happens to the password in Rails' `has_secure_password`?**
A: "The password goes through a hash function that puts some random number to generate a new hash and then this hash is saved on the database. For auth, the password tried by the user goes through this hashing function and then compares the two hashes."
- Good mental model! Correctly identified: hash before store, hash-and-compare for auth.
- Gap: didn't know the "random number" is called a salt, or why it exists (rainbow tables).

**Q: Why hash instead of encrypt?**
A: "Decrypting makes no sense cause you are adding an extra step that could be possibly exploitable and revealing the original password."
- Correct instinct. Encryption adds a key that becomes a single point of failure.

**Q: If the salt is stored in plain text and the attacker can see it, why does it still help?**
A: "Cause it prevents the hacker to create tables that work for everyone, the hacker would need the same salt and the same hash for every password in the world."
- Correct! The salt makes rainbow tables useless — each password must be cracked individually.

---

## Sources
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Auth0: Hashing in Action — Understanding bcrypt](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)
