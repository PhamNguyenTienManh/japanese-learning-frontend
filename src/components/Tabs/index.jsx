import { useState } from "react";
import styles from "./Tabs.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function Tabs({ children, defaultValue = "", active, onChange }) {
  const [value, setValue] = useState(defaultValue || active);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <div className={cx("tabs")}>
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
    <div className={cx("tabs-list")}>
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
      className={cx("tabs-trigger", { active: isActive })}
      onClick={() => onChange && onChange(value)}
    >
      {children}
    </button>
  );
}
TabsTrigger.displayName = "TabsTrigger";

function TabsContent({ value, active, children }) {
  if (value !== active) return null;
  return <div className={cx("tabs-content")}>{children}</div>;
}
TabsContent.displayName = "TabsContent";

export { TabsList, TabsTrigger, TabsContent };
export default Tabs;
