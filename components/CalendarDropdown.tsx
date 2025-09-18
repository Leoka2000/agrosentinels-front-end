"use client";

import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
} from "@heroui/dropdown";
import { cn } from "@/lib/utils"
import { RadioGroup, Radio } from "@heroui/radio";
import { Button, ButtonGroup } from "@heroui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@heroui/popover";
import {
  today,
  getLocalTimeZone,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
} from "@internationalized/date";

import { RangeCalendar} from "@heroui/calendar";
import { useLocale } from "@react-aria/i18n";

export default function CalendarDropdown() {
  const [value, setValue] = React.useState({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ weeks: 1, days: 3 }),
  });
  const [focusedValue, setFocusedValue] = React.useState(today(getLocalTimeZone()));
  const { locale } = useLocale();

  const now = today(getLocalTimeZone());
  const nextMonth = now.add({ months: 1 });

  const nextWeek = {
    start: startOfWeek(now.add({ weeks: 1 }), locale),
    end: endOfWeek(now.add({ weeks: 1 }), locale),
  };
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const nextMonthValue = { start: startOfMonth(nextMonth), end: endOfMonth(nextMonth) };

  const CustomRadio = (props: any) => {
    const { children, ...otherProps } = props;
    return (
      <Radio
        {...otherProps}
        classNames={{
          base: cn(
            "flex-none m-0 h-8 bg-content1 hover:bg-content2 items-center justify-between",
            "cursor-pointer rounded-full border-2 border-default-200/60",
            "data-[selected=true]:border-primary"
          ),
          label: "text-tiny text-default-500",
          labelWrapper: "px-1 m-0",
          wrapper: "hidden",
        }}
      >
        {children}
      </Radio>
    );
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="bordered">Select Date Range</Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 w-[320px]">
        <RangeCalendar
          bottomContent={
            <RadioGroup
              aria-label="Date precision"
              classNames={{
                base: "w-full pb-2",
                wrapper: "-my-2.5 py-2.5 px-3 gap-1 flex-nowrap max-w-[280px] overflow-x-scroll",
              }}
              defaultValue="exact_dates"
              orientation="horizontal"
            >
              <CustomRadio value="exact_dates">Exact dates</CustomRadio>
              <CustomRadio value="1_day">1 day</CustomRadio>
              <CustomRadio value="2_days">2 days</CustomRadio>
              <CustomRadio value="3_days">3 days</CustomRadio>
              <CustomRadio value="7_days">7 days</CustomRadio>
              <CustomRadio value="14_days">14 days</CustomRadio>
            </RadioGroup>
          }
          classNames={{ content: "w-full" }}
          focusedValue={focusedValue}
          nextButtonProps={{ variant: "bordered" }}
          prevButtonProps={{ variant: "bordered" }}
          topContent={
            <ButtonGroup
              fullWidth
              className="px-3 max-w-full pb-2 pt-3 bg-content1 [&>button]:text-default-500 [&>button]:border-default-200/60"
              radius="full"
              size="sm"
              variant="bordered"
            >
              <Button
                onPress={() => {
                  setValue(nextWeek);
                  setFocusedValue(nextWeek.end);
                }}
              >
                Next week
              </Button>
              <Button
                onPress={() => {
                  setValue(thisMonth);
                  setFocusedValue(thisMonth.start);
                }}
              >
                This month
              </Button>
              <Button
                onPress={() => {
                  setValue(nextMonthValue);
                  setFocusedValue(nextMonthValue.start);
                }}
              >
                Next month
              </Button>
            </ButtonGroup>
          }
          value={value}
          onChange={setValue}
          onFocusChange={setFocusedValue}
        />
      </PopoverContent>
    </Popover>
  );
}