"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface SectionCardsProps {
  card1?: {
    title?: string;
    value?: string;
    trend?: string;
    trendUp?: boolean;
    footer1?: string;
    footer2?: string;
  };
  card2?: {
    title?: string;
    value?: string;
    trend?: string;
    trendUp?: boolean;
    footer1?: string;
    footer2?: string;
  };
  card3?: {
    title?: string;
    value?: string;
    trend?: string;
    trendUp?: boolean;
    footer1?: string;
    footer2?: string;
  };
}

export function SectionCards({ card1, card2, card3 }: SectionCardsProps = {}) {
  // Card 1 values
  const c1Title = card1?.title ?? "Total Revenue"
  const c1Value = card1?.value ?? "$1,250.00"
  const c1Trend = card1 ? card1.trend : "+12.5%"
  const c1TrendUp = card1 ? (card1.trendUp ?? true) : true
  const c1Footer1 = card1 ? card1.footer1 : "Trending up this month"
  const c1Footer2 = card1 ? card1.footer2 : "Visitors for the last 6 months"

  // Card 2 values
  const c2Title = card2?.title ?? "New Customers"
  const c2Value = card2?.value ?? "1,234"
  const c2Trend = card2 ? card2.trend : "-20%"
  const c2TrendUp = card2 ? (card2.trendUp ?? false) : false
  const c2Footer1 = card2 ? card2.footer1 : "Down 20% this period"
  const c2Footer2 = card2 ? card2.footer2 : "Acquisition needs attention"

  // Card 3 values
  const c3Title = card3?.title ?? "Active Accounts"
  const c3Value = card3?.value ?? "45,678"
  const c3Trend = card3 ? card3.trend : "+12.5%"
  const c3TrendUp = card3 ? (card3.trendUp ?? true) : true
  const c3Footer1 = card3 ? card3.footer1 : "Strong user retention"
  const c3Footer2 = card3 ? card3.footer2 : "Engagement exceed targets"

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{c1Title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {c1Value}
          </CardTitle>
          {c1Trend && (
            <CardAction>
              <Badge variant="outline">
                {c1TrendUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {c1Trend}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        {(c1Footer1 || c1Footer2) && (
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            {c1Footer1 && (
              <div className="line-clamp-1 flex gap-2 font-medium">
                {c1Footer1}{" "}
                {c1TrendUp ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
              </div>
            )}
            {c1Footer2 && (
              <div className="text-muted-foreground">
                {c1Footer2}
              </div>
            )}
          </CardFooter>
        )}
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{c2Title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {c2Value}
          </CardTitle>
          {c2Trend && (
            <CardAction>
              <Badge variant="outline">
                {c2TrendUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {c2Trend}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        {(c2Footer1 || c2Footer2) && (
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            {c2Footer1 && (
              <div className="line-clamp-1 flex gap-2 font-medium">
                {c2Footer1}{" "}
                {c2TrendUp ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
              </div>
            )}
            {c2Footer2 && (
              <div className="text-muted-foreground">
                {c2Footer2}
              </div>
            )}
          </CardFooter>
        )}
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{c3Title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {c3Value}
          </CardTitle>
          {c3Trend && (
            <CardAction>
              <Badge variant="outline">
                {c3TrendUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {c3Trend}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        {(c3Footer1 || c3Footer2) && (
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            {c3Footer1 && (
              <div className="line-clamp-1 flex gap-2 font-medium">
                {c3Footer1}{" "}
                {c3TrendUp ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
              </div>
            )}
            {c3Footer2 && (
              <div className="text-muted-foreground">
                {c3Footer2}
              </div>
            )}
          </CardFooter>
        )}
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon
              />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  )
}

