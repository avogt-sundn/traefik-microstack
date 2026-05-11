import type { Meta, StoryObj } from "@storybook/html";

const meta: Meta = {
  title: "Patterns/Detail Form",
  parameters: {
    docs: {
      description: {
        component:
          "Single-record read/edit form. Apply when the record is already identified (arrived via Search Results or deep-link). See `ux/patterns/detail-form.mdx` for decision rules.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const formHtml = (readonly: boolean) => `
<div style="font-family: sans-serif; max-width: 480px; padding: 24px;">
  <nav style="font-size: 12px; color: #666; margin-bottom: 16px;">Search results &rsaquo; <strong>Partner detail</strong></nav>
  <h2 style="margin: 0 0 4px">Partner 100042</h2>
  <p style="margin: 0 0 24px; color: #888; font-size: 13px;">ALPHA01 &mdash; immutable</p>
  <div style="display:flex; flex-direction:column; gap:12px;">
    ${field("Name", "name1", "Acme GmbH", readonly)}
    ${field("Street", "street", "Hauptstraße 1", readonly)}
    ${field("City", "city", "Berlin", readonly)}
  </div>
  ${
    readonly
      ? ""
      : `<div style="margin-top:24px; display:flex; gap:8px;">
      <button style="padding:8px 16px; background:#1976d2; color:#fff; border:none; border-radius:4px; cursor:pointer">Save</button>
      <button style="padding:8px 16px; background:#eee; border:none; border-radius:4px; cursor:pointer">Cancel</button>
    </div>`
  }
</div>`;

function field(label: string, name: string, value: string, readonly: boolean) {
  return `<div>
    <label style="display:block; font-size:12px; color:#555; margin-bottom:4px">${label}</label>
    <input name="${name}" value="${value}" ${readonly ? "readonly" : ""}
      style="width:100%; padding:8px; border:1px solid ${readonly ? "#ddd" : "#aaa"}; border-radius:4px; background:${readonly ? "#f9f9f9" : "#fff"}; box-sizing:border-box" />
  </div>`;
}

export const ReadOnly: Story = {
  render: () => formHtml(true),
};

export const Editable: Story = {
  render: () => formHtml(false),
};
