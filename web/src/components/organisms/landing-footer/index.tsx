import Logo from '@/components/molecules/logo';
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa6';

const COLUMNS: {
  title: string;
  items: { label: string; href: string }[];
}[] = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Testimonials', href: '#testimonials' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: 'mailto:contact@talkup.ai' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Terms', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
];

const LandingFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo variant="line" color="primary" />
            <p className="text-body-m text-text-weaker max-w-xs">
              Career and interview preparation with realistic AI simulations,
              behavioral analysis, and personal coaching.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/BhuvanArn/TalkUp.AI"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-icon hover:text-accent transition-colors"
              >
                <FaGithub size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/talkup-ai/"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-icon hover:text-accent transition-colors"
              >
                <FaLinkedin size={20} />
              </a>
              <a
                href="https://www.instagram.com/talkup.ai/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-icon hover:text-accent transition-colors"
              >
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="text-body-s-strong text-text uppercase tracking-wider">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-body-m text-text-weaker hover:text-accent transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="text-body-s text-text-weakest">
            © {year} TalkUp.AI — All rights reserved.
          </p>
          <p className="text-body-s text-text-weakest">
            Made with care · Paris, France
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
