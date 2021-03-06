import { model, exporter, importer } from "makerjs";

export function convertPathToOutline(svgPath: string): string {
	const makerObject = model.simplify(
		importer.fromSVGPathData(svgPath, {
			bezierAccuracy: 1,
		})
	);

	return exporter
		.toSVGPathData(
			model.outline(makerObject, 5, 0, false, { trimDeadEnds: false }),
			{
				accuracy: 2,
				fillRule: "nonzero",
				origin: [0, 250],
			}
		)
		.toString();
}
