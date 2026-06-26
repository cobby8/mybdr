import React from "react";
import { Icon } from "@/components/admin-toss";

export type PageHeadProps = {
  eyebrow?: React.ReactNode;
  icon?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHead({ eyebrow, icon, title, sub, actions }: PageHeadProps) {
  return (
    <div className="ts-ph">
      <div className="ts-ph__row">
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div className="ts-ph__eyebrow">
              {icon && <Icon name={icon} size={15} />}
              {eyebrow}
            </div>
          )}
          <div className="ts-ph__title">{title}</div>
          {sub && <div className="ts-ph__sub">{sub}</div>}
        </div>
        {actions && <div className="ts-ph__actions">{actions}</div>}
      </div>
    </div>
  );
}
