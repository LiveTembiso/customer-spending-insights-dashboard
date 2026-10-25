import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export async function selectOption(label: string, option: string, index = 0) {
  screen.getAllByRole("combobox", { name: label })[index].focus();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.click(await screen.findByRole("option", { name: option }));
}
