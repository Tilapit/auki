# Overpass samples

Answers in the shape Overpass gives them (`[out:json]`, `out center tags`), for the pipeline's
tests. The pharmacies are invented: the shapes and the messy values are modelled on real
answers, but no name, address, phone number or email here belongs to anyone.

- `malta.json`: a country asked for in one piece.
- `switzerland.json`: a country asked for state by state, with a `state` marker element in
  front of each group (`pipeline/fetch.ts`).
