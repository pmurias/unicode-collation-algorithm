import { describe, it } from "mocha";
import { expect } from "chai";
import * as uca from "../build";

describe("compare test", () => {
	before(async () => {
		return uca.init();
	});
	it("大小比較", async () => {
		expect(uca.compare("a", "a", uca.PRIMARY)).to.eq(0);
		expect(uca.compare("a", "b", uca.PRIMARY)).to.eq(-1);
		expect(uca.compare("b", "a", uca.PRIMARY)).to.eq(1);
	});
	it("日本語系のテスト", async () => {
		expect(uca.compare("ギガゾンビ", "きかそんひ", uca.PRIMARY)).to.eq(0);
		expect(uca.compare("きかそんひ", "ギガゾンビ", uca.PRIMARY)).to.eq(0);
		expect(uca.compare("わわわわ", "わワﾜ㋻", uca.PRIMARY)).to.eq(0);
		expect(uca.compare("ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ", "あいうえおかきくけこさしすせそ", uca.PRIMARY)).to.eq(0);
		expect(uca.compare("ｬｭｮャュヨゃゅよ", "やゆよやゆよやゆよ", uca.PRIMARY)).to.eq(0);
	});
	it("Alphabet test", async () => {
		expect(uca.compare("YyÝýÿŶŷŸȲȳʸẎẏẙỲỳỴỵỶỷỸỹⓎⓨＹｙ", "YYYYYYYYYYYYYYYYYYYYYYYYYY", uca.PRIMARY)).to.eq(0);
	});
});
