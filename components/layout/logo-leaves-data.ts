// Generated from the former logo background image: the six leaf shapes, their six colour gradients and the
// 14 leaves (start position, timing, size). Used by logo-leaves.tsx.

export type Shape = "maple" | "oak" | "birch" | "ginkgo" | "elm" | "beech";
export type Fill = "red" | "orange" | "yellow" | "crimson" | "russet" | "gold";

export const SHAPES: Record<Shape, { body: string; veins: string }> = {
  "maple": {
    "body": "M0-14 2.2-8 6-9.5 5-4.5 10-5 7-.5 9.5 3 4 3.2 4.4 7.5 .6 5.5 .4 13H-.4L-.6 5.5-4.4 7.5-4 3.2-9.5 3-7-.5-10-5-5-4.5-6-9.5-2.2-8Z",
    "veins": "M0-12V12M0-5-5-8M0-5 5-8M0 0-7-2M0 0 7-2M0 4-3 6M0 4 3 6"
  },
  "oak": {
    "body": "M0-14C3-14 3.5-11 5-10.5 7.5-11 8.5-8 7-6.5 9.5-6 10-2.5 7.5-1.5 9.5 0 9 3.5 6.5 4 7.5 6 6 8.5 3.5 8 3 10.5 1.5 12 0 13-1.5 12-3 10.5-3.5 8-6 8.5-7.5 6-6.5 4-9 3.5-9.5 0-7.5-1.5-10-2.5-9.5-6-7-6.5-8.5-8-7.5-11-5-10.5-3.5-11-3-14 0-14Z",
    "veins": "M0-12V12M0-6-4-8M0-6 4-8M0-1-6-2M0-1 6-2M0 4-4 5.5M0 4 4 5.5"
  },
  "birch": {
    "body": "M0-13C4-9 8-4 7 2 6 7 2.5 9.5 0 10-2.5 9.5-6 7-7 2-8-4-4-9 0-13Z",
    "veins": "M0-11V9M0-5-3.5-2.5M0-5 3.5-2.5M0 0-4 2.5M0 0 4 2.5M0 4.5-2.5 6M0 4.5 2.5 6"
  },
  "ginkgo": {
    "body": "M0 13-.9 5C-9 4-11.5-3-8.5-8.5-5.5-11-2.5-9.5 0-7.5 2.5-9.5 5.5-11 8.5-8.5 11.5-3 9 4 .9 5Z",
    "veins": "M0 12V3M0 3-6-4M0 3-3-6M0 3 0-6M0 3 3-6M0 3 6-4"
  },
  "elm": {
    "body": "M0-13C6-10 8-2 5 6 3 10 1 12 0 14-1 11-5 9-6 4-7-3-5-9 0-13Z",
    "veins": "M0-11V12M0-5-3.5-2.5M0-5 3.5-2M0 0-4 3M0 0 3.5 3.5M0 6-2.5 7.5M0 6 2.5 8"
  },
  "beech": {
    "body": "M0 13C-6 8-10 2-8-4-6-9-1-8 0-4 1-8 6-9 8-4 10 2 6 8 0 13Z",
    "veins": "M0-4V12M0-4-4-6.5M0-4 4-6.5M0 1-5-1.5M0 1 5-1.5M0 6-3 4M0 6 3 4"
  }
};

export const VEIN = { stroke: "#4a1608", opacity: ".5", width: ".7" };

export const GRADIENTS: Record<Fill, [offset: string, color: string][]> = {
  "red": [
    [
      "0",
      "#ee5a34"
    ],
    [
      ".55",
      "#b3281c"
    ],
    [
      "1",
      "#701510"
    ]
  ],
  "orange": [
    [
      "0",
      "#ffb03a"
    ],
    [
      ".55",
      "#ec6a1c"
    ],
    [
      "1",
      "#a8420f"
    ]
  ],
  "yellow": [
    [
      "0",
      "#fff07a"
    ],
    [
      ".55",
      "#f6bb22"
    ],
    [
      "1",
      "#c98010"
    ]
  ],
  "crimson": [
    [
      "0",
      "#d23a35"
    ],
    [
      ".55",
      "#962028"
    ],
    [
      "1",
      "#5e1019"
    ]
  ],
  "russet": [
    [
      "0",
      "#d98a38"
    ],
    [
      ".55",
      "#9a5220"
    ],
    [
      "1",
      "#5f3012"
    ]
  ],
  "gold": [
    [
      "0",
      "#fff59a"
    ],
    [
      ".55",
      "#ffd23d"
    ],
    [
      "1",
      "#dca312"
    ]
  ]
};

/** x: horizontal start (user units of a 220×100 box); fall / fallDelay: seconds of the fall and its offset; sway / swayDelay: the tumble. */
export const LEAVES: { x: number; fall: number; fallDelay: number; shape: Shape; fill: Fill; scale: number; sway: number; swayDelay: number }[] = [
  {
    "x": 14,
    "fall": 10.5,
    "fallDelay": 0,
    "shape": "maple",
    "fill": "red",
    "scale": 0.62,
    "sway": 3.1,
    "swayDelay": 0
  },
  {
    "x": 33,
    "fall": 9.2,
    "fallDelay": 2.4,
    "shape": "oak",
    "fill": "russet",
    "scale": 0.56,
    "sway": 3.4,
    "swayDelay": 2.4
  },
  {
    "x": 52,
    "fall": 11.8,
    "fallDelay": 5.1,
    "shape": "birch",
    "fill": "yellow",
    "scale": 0.6,
    "sway": 2.7,
    "swayDelay": 2.4
  },
  {
    "x": 78,
    "fall": 9.6,
    "fallDelay": 1.3,
    "shape": "ginkgo",
    "fill": "gold",
    "scale": 0.55,
    "sway": 3,
    "swayDelay": 1.3
  },
  {
    "x": 96,
    "fall": 10.8,
    "fallDelay": 4.2,
    "shape": "maple",
    "fill": "orange",
    "scale": 0.7,
    "sway": 3.6,
    "swayDelay": 0.6
  },
  {
    "x": 116,
    "fall": 12.4,
    "fallDelay": 7.7,
    "shape": "elm",
    "fill": "orange",
    "scale": 0.58,
    "sway": 3.3,
    "swayDelay": 1.1
  },
  {
    "x": 134,
    "fall": 8.9,
    "fallDelay": 0.6,
    "shape": "beech",
    "fill": "red",
    "scale": 0.56,
    "sway": 2.9,
    "swayDelay": 0.6
  },
  {
    "x": 152,
    "fall": 10.1,
    "fallDelay": 3.8,
    "shape": "oak",
    "fill": "orange",
    "scale": 0.62,
    "sway": 3.2,
    "swayDelay": 0.6
  },
  {
    "x": 172,
    "fall": 11.2,
    "fallDelay": 6.4,
    "shape": "maple",
    "fill": "crimson",
    "scale": 0.6,
    "sway": 3.7,
    "swayDelay": 2.7
  },
  {
    "x": 190,
    "fall": 9.9,
    "fallDelay": 1.9,
    "shape": "ginkgo",
    "fill": "yellow",
    "scale": 0.58,
    "sway": 2.8,
    "swayDelay": 1.9
  },
  {
    "x": 206,
    "fall": 12.1,
    "fallDelay": 8.6,
    "shape": "birch",
    "fill": "gold",
    "scale": 0.56,
    "sway": 3.4,
    "swayDelay": 1.8
  },
  {
    "x": 66,
    "fall": 9.4,
    "fallDelay": 6.8,
    "shape": "elm",
    "fill": "russet",
    "scale": 0.6,
    "sway": 3.1,
    "swayDelay": 0.6
  },
  {
    "x": 104,
    "fall": 13,
    "fallDelay": 10.2,
    "shape": "maple",
    "fill": "yellow",
    "scale": 0.52,
    "sway": 3.9,
    "swayDelay": 2.4
  },
  {
    "x": 164,
    "fall": 10.6,
    "fallDelay": 9.1,
    "shape": "oak",
    "fill": "red",
    "scale": 0.54,
    "sway": 3.5,
    "swayDelay": 2.1
  }
];
