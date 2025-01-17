import { Form, Icon, Image } from "@raycast/api";
import type { useForm } from "@raycast/utils";

import {
  notionColorToTintColor,
  getPageIcon,
  Page,
  DatabaseProperty,
  User,
  PropertyConfig,
  getPropertyConfig,
} from "../../utils/notion";

export function createConvertToFieldFunc(
  itemPropsFor: GetFieldPropsFunc,
  relationPages: Record<string, Page[]> | undefined,
  users: User[],
) {
  return (property: DatabaseProperty) => {
    const { name, id } = property;
    let placeholder = property.type.replace(/_/g, " ");
    placeholder = placeholder.charAt(0).toUpperCase() + placeholder.slice(1);

    switch (property.type) {
      case "date":
        return <Form.DatePicker {...itemPropsFor<typeof property.type>(property)} title={name} key={id} id={id} />;
      case "checkbox":
        return <Form.Checkbox {...itemPropsFor<typeof property.type>(property)} key={id} id={id} label={placeholder} />;
      case "select":
      case "status":
        return (
          <Form.Dropdown {...itemPropsFor<typeof property.type>(property)} title={name} key={id} id={id}>
            {getPropertyConfig(property, [property.type])?.options.map(createMapOptionsFunc(Form.Dropdown.Item))}
          </Form.Dropdown>
        );
      case "multi_select":
      case "relation":
      case "people": {
        let options: PropertyConfig<"multi_select">["options"] | Page[] | User[] | undefined;
        if (property.type == "multi_select") options = getPropertyConfig(property, [property.type])?.options;
        else if (property.type == "people") options = users;
        else if (relationPages && property.type == "relation") {
          const relationId = getPropertyConfig(property, [property.type])?.database_id;
          if (relationId) options = relationPages[relationId];
        }
        return (
          <Form.TagPicker
            {...itemPropsFor<typeof property.type>(property)}
            title={name}
            key={id}
            id={id}
            placeholder={placeholder}
          >
            {options?.map(createMapOptionsFunc(Form.TagPicker.Item))}
          </Form.TagPicker>
        );
      }
      case "formula":
        return null;
      default:
        return (
          <Form.TextField
            {...itemPropsFor<typeof property.type>(property)}
            title={name}
            key={id}
            id={id}
            info="Supports a single line of inline Markdown"
            placeholder={placeholder}
          />
        );
    }
  };
}

function createMapOptionsFunc(Tag: typeof Form.Dropdown.Item | typeof Form.TagPicker.Item) {
  return (option: PropertyConfig<"select">["options"][number] | Page | User) => {
    if (!option.id) return null;
    let title: string | null;
    let icon: Image.ImageLike | undefined;
    if ("type" in option) {
      title = option.name;
      icon = option.avatar_url ? { source: option.avatar_url, mask: Image.Mask.Circle } : undefined;
    } else if ("object" in option) {
      title = option.title;
      icon = getPageIcon(option);
    } else {
      title = option.name;
      icon = option.color ? { source: Icon.Dot, tintColor: notionColorToTintColor(option.color) } : undefined;
    }
    return <Tag key={"option::" + option.id} value={option.id} title={title ?? "Untitled"} icon={icon} />;
  };
}

export type GetFieldPropsFunc = <T extends DatabaseProperty["type"]>(property: DatabaseProperty) => FieldProps<T>;

export type FieldProps<T extends DatabaseProperty["type"]> = ReturnType<
  typeof useForm<{
    [k: string]: T extends "date"
      ? Date | null
      : T extends "checkbox"
        ? boolean
        : T extends "multi_select" | "relation" | "people"
          ? string[]
          : T extends "formula"
            ? null
            : string;
  }>
>["itemProps"][string];
