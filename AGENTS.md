<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Public lead capture goes only through the server route `/api/public/create-lead` (service-role insert, strict validation in `src/lib/leads.ts`); never grant anon access to `public.leads`. Why: keeps the table private and the contract shared with the external Vue landing.
- Staff pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/login`). Why: session lives in browser storage.
- Landing styles are plain classes in `src/nido.css` migrated from the original Vue app; extend there instead of ad-hoc Tailwind colors. Why: fidelity to the original design.
