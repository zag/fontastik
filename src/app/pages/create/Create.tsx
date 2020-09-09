import * as React from "react";
import { FunctionComponent, useEffect, useState, MouseEvent } from "react";
import { Icon } from "../../global/Icon";
import { fontStore } from "../../store/font-store";
import "../Page.scss";
import { characters } from "./characters";
import "./Create.scss";
import { LetterDraw } from "./subcomponents/LetterDraw";
import { convertToTTF } from "../../font-processing/svg-font-string";
import { LoadingSpinner } from "../../global/LoadingSpinner";
import { useHttpClient } from "../../hooks/use-http-client";
import { Errors } from "../../global/Errors";
import { tokenStore } from "../../store/token-store";
import { Link } from "react-router-dom";

interface Step {
	setStep: (stepNumber: number) => void;
}

const Step0: FunctionComponent<Step> = ({ setStep }) => {
	const [complete, setComplete] = useState(false);

	return (
		<div className="contentAppear">
			<p className="paragraph paragraph--b">
				You see all that cool writing on the home page? They made their own font and
				you can too! Let's start with the letter 'A' in the box below.
			</p>
			<LetterDraw letter="A" setContainsLetter={setComplete} />
			{complete && (
				<p className="contentAppear paragraph">
					When you like how it looks hit{" "}
					<button
						className="button button__primary button--large"
						onClick={(e) => {
							e.preventDefault();
							setStep(1);
						}}
					>
						Next <Icon withMargin="right">arrow_forward</Icon>
					</button>
				</p>
			)}
		</div>
	);
};

const Step1: FunctionComponent<Step> = ({ setStep }) => {
	const [complete, setComplete] = useState(false);
	return (
		<div className="contentAppear">
			<p className="paragraph paragraph--b">
				Do you know what's coming next? You guessed it baby, I'm gonna need you to
				draw the letter 'a'.
			</p>
			<LetterDraw letter="a" setContainsLetter={setComplete} />
			{complete && (
				<>
					<p className="contentAppear paragraph">
						Looking good, my friend.{" "}
						<button
							className="button button__primary button--large"
							onClick={(e) => {
								e.preventDefault();
								setStep(2);
							}}
						>
							Next <Icon withMargin="right">arrow_forward</Icon>
						</button>
					</p>
				</>
			)}
		</div>
	);
};

const Step2: FunctionComponent<Step> = ({ setStep }) => {
	const [selectedLetter, setSelectedLetter] = useState(characters[2]);
	const [completedLetters, setCompletedLetters] = useState(
		Object.keys(fontStore.get())
	);

	const getLiClassName = (letter: string) => {
		const classes = ["letterNavigation__item"];
		if (letter === selectedLetter) {
			classes.push("letterNavigation__item--current");
		}
		if (completedLetters.includes(letter)) {
			classes.push("letterNavigation__item--completed");
		}
		return classes.join(" ");
	};

	return (
		<div className="contentAppear">
			<p className="paragraph paragraph--b">It's the alphabet time buddy!</p>
			<LetterDraw
				letter={selectedLetter}
				setContainsLetter={(containsIt) => {
					if (containsIt) {
						setCompletedLetters([selectedLetter, ...completedLetters]);
					} else {
						setCompletedLetters(
							completedLetters.filter((letter) => letter !== selectedLetter)
						);
					}
				}}
			/>
			<ol className="letterNavigation" id="letterNavigation">
				{characters.map((letter) => (
					<li className={getLiClassName(letter)} key={letter}>
						<a
							href={`#${letter}`}
							className="letterNavigation__item__a"
							onClick={(e) => {
								e.preventDefault();
								const container = document.getElementById("letterNavigation");
								if (container) {
									container.scrollTo({
										left:
											e.currentTarget.offsetLeft -
											container.clientWidth / 2 +
											e.currentTarget.clientWidth / 2,
										behavior: "smooth",
									});
								}
								setSelectedLetter(letter);
							}}
						>
							{fontStore.get()[letter]?.length > 0 ? (
								<svg
									className="letterPreviewSvg"
									width="1em"
									height="1em"
									viewBox="0 0 250 250"
								>
									<path d={fontStore.get()[letter]} />
								</svg>
							) : (
								letter
							)}
						</a>
					</li>
				))}
			</ol>
			<p className="contentAppear paragraph">
				Looking good, my friend.{" "}
				<button
					className="button button__primary button--large"
					onClick={(e) => {
						e.preventDefault();
						setStep(3);
					}}
				>
					Next <Icon withMargin="right">arrow_forward</Icon>
				</button>
			</p>
		</div>
	);
};

type Stage = "generating" | "initial" | "saving" | "saved";

export const Step3: FunctionComponent<Step> = ({ setStep }) => {
	const [previewText, setPreviewText] = useState("");
	const [fontTtf, setFontTtf] = useState(new Uint8Array());

	const [errors, setErrors] = useState([] as string[]);
	const [stage, setStage] = useState("generating" as Stage);

	const token = tokenStore.get();
	const http = useHttpClient();
	const font = fontStore.get();

	useEffect(() => {
		convertToTTF(font).then((res) => {
			document.fonts.add(new FontFace("Handwriting", res.buffer));
			setFontTtf(res.buffer);
			setStage("initial");
		});
	}, []);

	const onSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		setErrors([]);
		setStage("saving");

		const response = await http.request({
			method: "POST",
			uri: "font-data",
			body: {
				fontData: Object.values(fontTtf),
			},
			withAuth: true,
		});
		const result = await response.json();

		if (!response.ok) {
			setStage("initial");
			if (result.message) {
				setErrors(
					Array.isArray(result.message) ? result.message : [result.message]
				);
			} else {
				setErrors(["Something went wrong saving your font."]);
			}
		} else {
			setStage("saved");
		}
	};

	return (
		<div className="contentAppear">
			<div>
				{stage === "generating" && (
					<p className="paragraph">
						<LoadingSpinner /> Generating your font
					</p>
				)}
				{stage !== "generating" && (
					<>
						<textarea
							className="fontPreview"
							autoFocus={true}
							value={previewText}
							onChange={(event) => {
								setPreviewText(event.target.value);
							}}
						></textarea>
						{stage === "saved" && (
							<p className="paragraph">
								Your font has been saved! Now you can go spread the word on the home
								page.
							</p>
						)}
						{stage !== "saved" && (
							<>
								{token && (
									<>
										<button
											disabled={stage === "saving"}
											className="button button__primary button--large"
											onClick={onSubmit}
										>
											Save font <Icon withMargin="right">font_download</Icon>
										</button>
										{stage === "saving" && <LoadingSpinner />}
										<Errors errors={errors} />
									</>
								)}
								{!token && (
									<>
										<p className="paragraph paragraph--b">
											To save your font to use in posts please create, or log in to, your
											account.
										</p>
										<Link className="button button__primary button--large" to="account">
											Log in or create an account
										</Link>
									</>
								)}
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export const Create = () => {
	const [step, setStep] = useState(0);

	return (
		<div className="createPage">
			<h2 className="pageTitle contentAppear">Create your own font.</h2>
			{
				[
					<Step0 setStep={setStep} key={0} />,
					<Step1 setStep={setStep} key={1} />,
					<Step2 setStep={setStep} key={2} />,
					<Step3 setStep={setStep} key={3} />,
				][step]
			}
		</div>
	);
};
