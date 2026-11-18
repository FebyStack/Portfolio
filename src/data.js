export const SKILLS = [
  ['Next.js', 'build'], ['Figma', 'design'], ['Social media management', 'social'], ['Claude', 'ai'], ['CapCut', 'video'],
  ['React Native', 'build'], ['UX/UI design', 'design'], ['Content strategy', 'social'], ['Prompt design', 'ai'], ['Reel editing', 'video'],
  ['Supabase', 'build'], ['Canva', 'design'], ['Copywriting', 'social'], ['AI agents and skills', 'ai'], ['Code animation', 'video'],
  ['Expo', 'build'], ['Design systems', 'design'], ['Content planning', 'social'], ['AI workflows', 'ai'], ['Sound design', 'video'],
  ['PostgreSQL', 'build'], ['Brand identity', 'design'], ['Other AI tools', 'ai'], ['Lovable', 'build'], ['Prototyping', 'design'],
  ['Firebase', 'build']
];
export const GROUPS = [['build', 'Build'], ['design', 'Design'], ['social', 'Social'], ['video', 'Video'], ['ai', 'AI']];
/* Projects, in card order.
   id: the project's address, #work/<id> (shared links use it, so keep it once it's out).
   Its card in index.html (the article whose link is #work/<id>) repeats title and desc; change both (data.test.js
   checks).
   image: a screenshot path or URL, e.g. '/img/work/pilapass.webp'; once set it replaces the ASCII cover on the card and
   in the project view. alt: what the screenshot shows. links (optional): [label, url] pairs shown in the project view. */
export const PROJECTS = [
  { id: 'pilapass', title: 'PilaPass', shape: 1,
    desc: 'A campus queue app my team and I are building.',
    role: 'Design and build', type: 'Campus queue app', status: 'In development, team',
    more: 'I designed it and fully integrated the frontend and backend, with Supabase as the database. It’s for JRMSU Main Campus at first and isn’t in use yet.',
    tools: 'React Native, Expo and Supabase', image: '', alt: '' },
  { id: 'sev-clinic', title: 'The Sev Clinic', shape: 0,
    desc: 'I run its digital operations, social media and graphic design.',
    role: 'Operations, content and social', type: '', status: 'Ongoing since May 2026',
    more: 'I go to the clinic to record content, then edit the videos myself. When their website has a technical problem, I fix it. Basically, I’m their IT manpower.',
    tools: '', image: '', alt: '' },
  { id: 'inkwild', title: 'INKWILD', shape: 3,
    desc: 'My animated series about how animals sense the world.',
    role: 'Animation, narration and sound', type: '', status: 'About ten episodes on TikTok, four on YouTube',
    more: 'It’s drawn in ink and stipple. I also use AI in the editing and animation. I take animation and motion work for others too, in the INKWILD style or a different one.',
    tools: '', image: '', alt: '',
    links: [['TikTok', 'https://www.tiktok.com/@inkwil0'], ['YouTube', 'https://www.youtube.com/@inkwildanimals']] },
  { id: 'invex', title: 'Invex', shape: 2,
    desc: 'Our school project: every branch’s inventory in one dashboard.',
    role: 'Team project', type: 'Full-stack inventory system', status: 'School project, not live',
    more: 'It’s for businesses that keep stock of their products, and it imports and exports Excel and CSV files. We’re looking for businesses to use it.',
    tools: 'Node.js, Express, PostgreSQL (raw SQL, no ORM), JWT, WebSockets, plain HTML, CSS and JavaScript', image: '', alt: '' },
  { id: 'konsepto', title: 'KONSEPTO Events', shape: 4,
    desc: 'I record each event and post on their socials every day.',
    role: 'Event content and social', type: '', status: 'Ongoing',
    more: 'I also take pictures, edit the videos and create the content. I plan and write their posts too, using top-, middle- and bottom-of-funnel content.',
    tools: '', image: '', alt: '' }
];
/* "#work/<id>" → that project's index; -1 for any other hash */
export const projectAt = (hash) => PROJECTS.findIndex((p) => hash === '#work/' + p.id);
