type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment =
    align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl";

  return (
    <div className={alignment}>
      {eyebrow ? (
        <p className="serene-eyebrow mb-4">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--serene-on-surface)] sm:text-4xl lg:text-[3rem]">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-[var(--serene-on-surface-variant)] sm:text-lg">
        {description}
      </p>
    </div>
  );
}
