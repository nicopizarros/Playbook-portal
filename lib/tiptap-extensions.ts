import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

// Shared by the client editor (components/admin/TipTapEditor.tsx) and the
// server-side bodyHtml generation (lib/actions/admin.ts's generateHTML call)
// so the two can never drift — an extension added to one without the other
// would mean the editor accepts content the server can't render, or the
// server renders markup the editor's schema would reject on next load.
// None of these extensions touch the DOM at config time (verified: they
// import cleanly under plain Node, only their view-rendering code needs a
// browser), so this module is safe to import from a Server Action.
export const TIPTAP_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Image,
  Link.configure({ openOnClick: false }),
];
