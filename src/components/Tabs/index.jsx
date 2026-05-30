import { useState } from "react";

function Tabs({ children, defaultValue = "", active, onChange }) {
  const [value, setValue] = useState(defaultValue || active);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <div className="flex w-full flex-col">
      {Array.isArray(children)
        ? children.map((child) => {
            if (!child) return null;
            if (child.type.displayName === "TabsList") {
              return (
                <child.type
                  {...child.props}
                  active={active || value}
                  onChange={handleChange}
                />
              );
            }
            if (child.type.displayName === "TabsContent") {
              return <child.type {...child.props} active={active || value} />;
            }
            return child;
          })
        : children}
    </div>
  );
}

function TabsList({ children, active, onChange }) {
  return (
    <div className="mb-3 flex gap-1.5 rounded-[10px] bg-[#ddd5d7]">
      {children.map((child) =>
        child.type.displayName === "TabsTrigger" ? (
          <child.type
            {...child.props}
            active={active}
            onChange={onChange}
            key={child.props.value}
          />
        ) : (
          child
        )
      )}
    </div>
  );
}
TabsList.displayName = "TabsList";

function TabsTrigger({ value, children, active, onChange }) {
  const isActive = active === value;
  return (
    <button
      className={[
        "m-1 flex-1 cursor-pointer rounded-lg border-0 px-3 py-1.5 text-sm transition",
        isActive
          ? "bg-[var(--white)] font-semibold text-[var(--black)]"
          : "bg-transparent font-medium text-[#777]",
      ].join(" ")}
      onClick={() => onChange && onChange(value)}
    >
      {children}
    </button>
  );
}
TabsTrigger.displayName = "TabsTrigger";

function TabsContent({ value, active, children }) {
  if (value !== active) return null;
  return <div className="pt-1">{children}</div>;
}
TabsContent.displayName = "TabsContent";

export { TabsList, TabsTrigger, TabsContent };
export default Tabs;
