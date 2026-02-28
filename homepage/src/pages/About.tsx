import { useTranslation } from 'react-i18next';

interface ProfileProps {
  imageUrl?: string;
  name?: string;
  occupation?: string;
  linkedIn?: string;
  affiliations?: { src: string; alt: string }[];
}

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function Profile({
  imageUrl = "https://via.placeholder.com/150",
  name = "Name",
  occupation = "Occupation",
  linkedIn,
  affiliations = [],
}: ProfileProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 w-full">
      <a
        href={linkedIn}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative"
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-32 h-32 rounded-full object-cover border-2 border-orange-300 shadow-md flex-shrink-0 transition-opacity group-hover:opacity-80"
        />
      </a>
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-semibold leading-tight">{name}</h3>
          {linkedIn && (
            <a
              href={linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0A66C2] hover:text-[#004182] transition-colors"
              aria-label={`${name} on LinkedIn`}
            >
              <LinkedInIcon />
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-tight mt-1">{occupation}</p>
      </div>
      <div className="flex items-center justify-center gap-2 mt-1 min-h-[2rem]">
        {affiliations.map((a, i) => (
          <img
            key={i}
            src={a.src}
            alt={a.alt}
            className="w-8 h-8 rounded-full object-contain"
          />
        ))}
      </div>
    </div>
  );
}

const teamMembers: ProfileProps[] = [
  {
    imageUrl: "/lukas.JPG",
    name: "Lukas Ketzer",
    occupation: "CS @ TUM",
    linkedIn: "https://www.linkedin.com/in/lukasketzer/",
    affiliations: [
      { src: "/tum-logo.png", alt: "Affiliation" },
    ],
  },
  {
    imageUrl: "/david.jpg",
    name: "David Holzwarth",
    occupation: "CS @ TUM",
    linkedIn: "https://www.linkedin.com/in/david-holzwarth-160613211/",
    affiliations: [
      { src: "/tum-logo.png", alt: "TUM" },
    ],
  },
  {
    imageUrl: "/carlo.jpg",
    name: "Carlo Ziesemer",
    occupation: "Managment & Technology @ TUM",
    linkedIn: "https://www.linkedin.com/in/carlziesemer/",
    affiliations: [
      { src: "/tum-logo.png", alt: "TUM" },
    ],
  },
  {
    imageUrl: "/moritz.jpg",
    name: "Moritz Soppe",
    occupation: "Engineering Science @ TUM",
    linkedIn: "https://www.linkedin.com/in/christoph-moritz-soppe/",
    affiliations: [
      { src: "/tum-logo.png", alt: "TUM" },
    ],
  },
];

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-2 text-orange-500 text-center">
        {t('about.title')}
      </h1>
      <p className="text-lg text-center text-muted-foreground mb-12">
        {t('about.subtitle')}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-4xl mx-auto">
        {teamMembers.map((member, i) => (
          <Profile key={i} {...member} />
        ))}
      </div>
    </div>
  );
}
