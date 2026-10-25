import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { selectOption } from "@/test-utils/select";
import { SelectField } from "./select-field";

const items = [
  { value: "", label: "All categories" },
  { value: "Groceries", label: "Groceries" },
];

describe("SelectField", () => {
  it("opens a shadcn listbox and reports the chosen item", async () => {
    const onValueChange = vi.fn();
    render(
      <SelectField
        id="category"
        label="Category"
        value=""
        items={items}
        onValueChange={onValueChange}
      />,
    );
    expect(
      screen.getByRole("combobox", { name: "Category" }),
    ).toHaveTextContent("All categories");
    await selectOption("Category", "Groceries");
    expect(onValueChange).toHaveBeenCalledWith("Groceries");
  });

  it("clears a category through the all-categories item", async () => {
    const onValueChange = vi.fn();
    render(
      <SelectField
        id="category"
        label="Category"
        value="Groceries"
        items={items}
        onValueChange={onValueChange}
      />,
    );
    await selectOption("Category", "All categories");
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("keeps a required selection when its surrounding form resets", async () => {
    const onValueChange = vi.fn();
    render(
      <form>
        <SelectField
          id="category"
          label="Category"
          value="Groceries"
          items={items}
          onValueChange={onValueChange}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("combobox", { name: "Category" }),
    ).toHaveTextContent("Groceries");
  });
});
