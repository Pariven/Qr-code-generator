"use client"

interface ConfigurableOptionsProps {
  settings: {
    errorCorrection: string
    pixelsPerBlock: number
    borderBlocks: number
    separator: string
    addDataString: boolean
    treatAsCSV: boolean
    addFilename: boolean
    fontSize: string
    rotate: string
    fgColor: string
    transparentBg: boolean
    outputFormat: string
  }
  updateSetting: (key: string, value: any) => void
}

export default function ConfigurableOptions({ settings, updateSetting }: ConfigurableOptionsProps) {
  return (
    <div className="space-y-6 bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Code Configuration */}
        <div className="space-y-3">
          <h3 className="text-foreground font-medium text-sm">Code Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Error Correction</label>
              <select
                value={settings.errorCorrection}
                onChange={(e) => updateSetting("errorCorrection", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>Quartile</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Pixels per Block</label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.pixelsPerBlock}
                onChange={(e) => updateSetting("pixelsPerBlock", Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Border Blocks</label>
              <input
                type="number"
                min={2}
                value={settings.borderBlocks}
                onChange={(e) => updateSetting("borderBlocks", Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Separator</label>
              <input
                type="text"
                value={settings.separator}
                onChange={(e) => updateSetting("separator", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Text Options */}
        <div className="space-y-3">
          <h3 className="text-foreground font-medium text-sm">Text Options</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.addDataString}
                onChange={(e) => updateSetting("addDataString", e.target.checked)}
                className="w-4 h-4 border border-input rounded accent-green-500"
              />
              <span className="text-foreground text-xs">Add data string below QR</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.treatAsCSV}
                onChange={(e) => updateSetting("treatAsCSV", e.target.checked)}
                className="w-4 h-4 border border-input rounded accent-green-500"
              />
              <span className="text-foreground text-xs">Treat as CSV</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.addFilename}
                onChange={(e) => updateSetting("addFilename", e.target.checked)}
                className="w-4 h-4 border border-input rounded accent-green-500"
              />
              <span className="text-foreground text-xs">Add filename under QR</span>
            </label>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Font Size</label>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSetting("fontSize", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* Design Options */}
        <div className="space-y-3">
          <h3 className="text-foreground font-medium text-sm">Design Options</h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Rotate</label>
              <select
                value={settings.rotate}
                onChange={(e) => updateSetting("rotate", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>None</option>
                <option>90°</option>
                <option>180°</option>
                <option>270°</option>
              </select>
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Foreground Color</label>
              <input
                type="color"
                value={settings.fgColor}
                onChange={(e) => updateSetting("fgColor", e.target.value)}
                className="w-full h-10 border border-input rounded cursor-pointer"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.transparentBg}
                onChange={(e) => updateSetting("transparentBg", e.target.checked)}
                className="w-4 h-4 border border-input rounded accent-green-500"
              />
              <span className="text-foreground text-xs">Transparent background</span>
            </label>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Output Format</label>
              <select
                value={settings.outputFormat}
                onChange={(e) => updateSetting("outputFormat", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>PNG</option>
                <option>SVG</option>
                <option>JPG</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
