-- Taxonomy seed -- professions and skills.
-- Source: stage-10-taxonomy.md. Run once after migration 002 (idempotent via
-- ON CONFLICT). Members can add more skills through onboarding; this is the
-- starting set, not an exhaustive list.

-- ---------------------------------------------------------------------------
-- Professions (category + synonyms for search)
-- ---------------------------------------------------------------------------
insert into public.professions (name, category, synonyms) values
  ('Civil Engineer',        'Engineering & Construction', array['civil engineering','structural engineer']),
  ('Mechanical Engineer',   'Engineering & Construction', array['mechanical engineering']),
  ('Electrical Engineer',   'Engineering & Construction', array['electrical engineering']),
  ('Architect',             'Engineering & Construction', array['architecture']),
  ('Quantity Surveyor',     'Engineering & Construction', array['qs','quantity surveying']),
  ('Site Supervisor',       'Engineering & Construction', array['site foreman','construction supervisor']),
  ('Electrician',           'Engineering & Construction', array['electrical technician']),
  ('Plumber',               'Engineering & Construction', array['plumbing']),
  ('HR Manager',            'Business & Administration',  array['hr','human resources','human resource manager']),
  ('HR Officer',            'Business & Administration',  array['hr','human resources officer']),
  ('Office Administrator',  'Business & Administration',  array['admin','administrator','office admin']),
  ('Operations Manager',    'Business & Administration',  array['ops manager','operations']),
  ('Project Manager',       'Business & Administration',  array['pm','project management']),
  ('Accountant',            'Finance & Accounting',       array['accounting','accounts']),
  ('Auditor',               'Finance & Accounting',       array['audit','auditing']),
  ('Bookkeeper',            'Finance & Accounting',       array['bookkeeping','accounts clerk']),
  ('Financial Analyst',     'Finance & Accounting',       array['finance analyst','financial analysis']),
  ('Software Developer',    'Technology',                array['developer','programmer','software engineer','full stack dev','full-stack developer']),
  ('IT Support',            'Technology',                array['it technician','helpdesk','technical support']),
  ('Network Technician',    'Technology',                array['network engineer','networking']),
  ('Data Analyst',          'Technology',                array['data analysis','analyst']),
  ('Teacher',               'Education',                 array['tutor','educator','lecturer']),
  ('Tutor',                 'Education',                 array['private tutor','teaching assistant']),
  ('School Administrator',  'Education',                 array['school admin','headteacher','academic administrator']),
  ('Nurse',                 'Healthcare',                array['nursing','registered nurse']),
  ('Clinical Officer',      'Healthcare',                array['co','medical officer']),
  ('Pharmacist',            'Healthcare',                array['pharmacy','dispenser']),
  ('Lab Technician',        'Healthcare',                array['laboratory technician','medical lab tech']),
  ('Driver',                'Transport & Logistics',     array['chauffeur','motorist','delivery driver']),
  ('Logistics Coordinator', 'Transport & Logistics',     array['logistics','supply chain coordinator']),
  ('Fleet Manager',         'Transport & Logistics',     array['fleet management','transport manager']),
  ('Advocate',              'Legal',                     array['lawyer','attorney','barrister']),
  ('Paralegal',             'Legal',                     array['legal assistant']),
  ('Legal Secretary',       'Legal',                     array['legal admin']),
  ('Welder',                'Trade & Technical',         array['welding','fabricator']),
  ('Mechanic',              'Trade & Technical',         array['auto mechanic','motor vehicle mechanic']),
  ('Carpenter',             'Trade & Technical',         array['carpentry','joiner']),
  ('Tailor',                'Trade & Technical',         array['seamstress','dressmaker']),
  ('Sales Representative',  'Sales & Marketing',         array['sales rep','salesperson','sales executive']),
  ('Marketing Officer',     'Sales & Marketing',         array['marketing','marketer']),
  ('Customer Service',      'Sales & Marketing',         array['customer care','customer support','client service']),
  ('Graphic Designer',      'Creative & Design',         array['designer','graphics','visual designer']),
  ('Photographer',          'Creative & Design',         array['photography']),
  ('Videographer',          'Creative & Design',         array['video editor','cameraman','video production'])
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Skills (flat list; members add more during onboarding)
-- ---------------------------------------------------------------------------
insert into public.skills (name, synonyms) values
  ('AutoCAD',                array['auto cad','cad']),
  ('Structural Design',      array['structural analysis']),
  ('Construction Management', array['construction supervision']),
  ('Project Management',     array['pm','project planning']),
  ('Recruitment',            array['hiring','talent acquisition']),
  ('Payroll',                array['payroll processing']),
  ('Bookkeeping',            array['accounts','ledger management']),
  ('Financial Reporting',    array['financial statements']),
  ('Microsoft Excel',        array['excel','spreadsheets']),
  ('QuickBooks',             array['quick books']),
  ('JavaScript',             array['js']),
  ('Python',                 array[]::text[]),
  ('SQL',                    array['databases']),
  ('Networking',             array['network administration']),
  ('Customer Service',       array['customer care','client support']),
  ('Sales',                  array['selling','business development']),
  ('Teaching',               array['instruction','lesson planning']),
  ('First Aid',              array['emergency care']),
  ('Class C Driving License', array['class c licence','driving licence c']),
  ('Defensive Driving',      array['safe driving']),
  ('Welding',                array['arc welding','mig welding']),
  ('Carpentry',              array['woodwork']),
  ('Graphic Design',         array['adobe illustrator','adobe photoshop']),
  ('Photography',            array['photo editing']),
  ('Video Editing',          array['adobe premiere','final cut']),
  ('Leadership',             array['team management']),
  ('Communication',          array['written communication','verbal communication']),
  ('Report Writing',         array['technical writing'])
on conflict (name) do nothing;
