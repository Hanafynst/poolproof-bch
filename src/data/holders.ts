import type { ConcentrationHolder } from "../core/concentration";

/**
 * Captured holder lists for the demo snapshots (TokenStork, R26).
 *
 * Verbatim transcriptions of the practice fixtures
 * practice/fixtures/tokenstork-pusd-holders.json (100 entries) and
 * practice/fixtures/tokenstork-olando-holders.json (48 entries):
 * richest first, balances in token base units, exactly as the
 * holders endpoint served them. The concentration module
 * (src/core/concentration.ts) computes every rendered figure from
 * these lists at render time — nothing here is precomputed, so a
 * figure on screen can always be re-derived from this data.
 *
 * PUSD's list is the source-capped top 100 of 153 holders; its
 * reported supply is an int64 genesis sentinel, so the snapshot
 * marks supplyIsSentinel and no share-of-supply is ever computed
 * for it. 0LANDO's list is complete (48 of 48) against a real
 * supply that matched our independent Cauldron read (R15/R26).
 */

export const PUSD_HOLDERS: ConcentrationHolder[] = [
  {
    address: "pvszuucxz7fn4pthapvfk3xy8gxjhpvcm9yjt2przz44v5z2ax7v6alt8qj02",
    balance: 9223372036656771194n,
  },
  {
    address: "pdl8y563h887re3r8g4sv76y29jt6vhtpzy9fc8qshmc8x30zjunj7cqx5ee3",
    balance: 14934665n,
  },
  {
    address: "p0nkux98t6x0d2k24jhr6zc8xfredher9kq9fp6a0flafgvehml5xqswpc96w",
    balance: 4927701n,
  },
  {
    address: "pvw8f4udya0zwczdu2a96stt4s95uqsurk3s5j4eur04776xnukqcu7lhg7xu",
    balance: 2762486n,
  },
  {
    address: "pwj4a52mc0788c0lpn3cwv760ne82ltl90ujnakth9fff29w6r67yqak8f6ge",
    balance: 1184742n,
  },
  {
    address: "qqu7jkxr87cuz0mxsfcy02kj98ccuh9eaykw8mq5u5",
    balance: 500000n,
  },
  {
    address: "pdrj6xt5nx882ymhhv9l69k5gagdsj6vgn778kecnmp7auk8v270yhwewdl3y",
    balance: 484234n,
  },
  {
    address: "qzwv08mmdds3er6gql9qvj2xu8r5celnl5w7tdwx0v",
    balance: 465428n,
  },
  {
    address: "qqf0edcxlfnzktm77eqg874jup28ta6a6u5ry5sfu9",
    balance: 439525n,
  },
  {
    address: "pvqu7v890q8ffzm796uq0ljp353leglmqefxgmfuncl3wddndagtck644hjl6",
    balance: 347615n,
  },
  {
    address: "pwe5045v35kdkvsxd056lqzvdlac4wa5gx7lxm908q6rd08u4g6ukn372ggwl",
    balance: 321854n,
  },
  {
    address: "pdwzm508wvx8yjs24hq8gxuh3p2mtqfu34vdlvu07qcrez4yr45zc7h5cxdv4",
    balance: 227691n,
  },
  {
    address: "pv0wg9p0ly5tf2nf9v773h3f9xlrjpwxqf7nh29s5t83cz65s7ktqahr9yagd",
    balance: 209027n,
  },
  {
    address: "pvadwln6dz5jge5l3uv4yc7fc9lyu3yaq8wzyt6d8e2360url3ge52h6cellw",
    balance: 208081n,
  },
  {
    address: "qpf4c5ucqyfru9r6ak540m6j9982pgfcnq0xqlpn73",
    balance: 130000n,
  },
  {
    address: "qrqqfy507sw5njrynuyclh0qfrvy4ljl3uldwgpwk9",
    balance: 100948n,
  },
  {
    address: "qzgkhvn4hlw0a2dzul2scec46lfvy6yh8gwe49u68s",
    balance: 90005n,
  },
  {
    address: "pwda2wued7xc5zj7csc70n55hzh9k26h2uxkdrm2wgt780c8842svep8pyxt8",
    balance: 86090n,
  },
  {
    address: "qqytt7jjxds269xxm60lprpd8ea786xw3c4ryq0g79",
    balance: 82497n,
  },
  {
    address: "qryn24qv276duut77ga4n628s5tdzns4wyl0fknw08",
    balance: 62771n,
  },
  {
    address: "pw7tg2dlyral5ueyfldp5g83p8v28dnrv8klusf30r88sur5kqd6yvpeqh76n",
    balance: 62015n,
  },
  {
    address: "pw7nxzynljvll6sgeh5k2m3cf2fu95gq0l4g9enflmne5k6cpjswyyksrhwhl",
    balance: 50341n,
  },
  {
    address: "pwny5efsj93n9xqxyad94xdj0pfykgdyv4vau3l0ensf35lttv4qu2xrs36wh",
    balance: 48928n,
  },
  {
    address: "qrz697tylpfhde5028ymhzgk3pet5apc9s0tvcx4yr",
    balance: 41330n,
  },
  {
    address: "qprlvhhrjaqw5hxcnqnf7fyzdk00uwa2rqcpc65f45",
    balance: 33936n,
  },
  {
    address: "pd5ddpx7qju9q8ae94slzfl24z5gaxzvz30ryph7e7zwwnj03hu52zpd3mr9n",
    balance: 33664n,
  },
  {
    address: "qq00xmdnsdhtj4dr54s565h75et8svqz5g5z9z7nhf",
    balance: 31758n,
  },
  {
    address: "pw9mnkw0q09p5cdwuhvnsvkc429r9fcegt6k6gvaju2adkvvwmwkgv8sgeqfl",
    balance: 27453n,
  },
  {
    address: "pva5kxp9mkpnhhjyynwdhqtmhpc9tqakta040z0a2rqhktpg6fs8yee5ygwsv",
    balance: 27322n,
  },
  {
    address: "qz4smcfq84p8fqdjgla2pdp5470afx37aqah5dmaj9",
    balance: 25383n,
  },
  {
    address: "pdcuzguxklwhzdd6sdwsfr5rhpdazu7cj99ypvszlywehu426lvkxh5hk4ug6",
    balance: 21952n,
  },
  {
    address: "qpm2pc56txxctcapv9l2asxermq2y0ucdsxgpte5qj",
    balance: 19991n,
  },
  {
    address: "qzylchcclsrt2pwnp4mgszv3ycmsl8wuyc52rckl9s",
    balance: 19900n,
  },
  {
    address: "qqkwh9v4x69nw3563qcf9haq9dulx8k98q5ggh2qgv",
    balance: 19588n,
  },
  {
    address: "pvua9a8wv7s4jsv30wtfjlv8nqacgptayxhnj44kz93d7us564efw7su39dfl",
    balance: 19479n,
  },
  {
    address: "pvlejtgjjpq3xayvg3puze8v7yh535dsw5vq3c44xuvyjlsjl995z7q8w2y8k",
    balance: 17284n,
  },
  {
    address: "qpx0luscd0rl0r6z87y9q0uvev82hphfku6keh3ct8",
    balance: 16480n,
  },
  {
    address: "qpv2u887newgw849vpkls6fywrmulj4u5qa3949tg5",
    balance: 15124n,
  },
  {
    address: "pdyy4els9wlr8mwy607zzrdk8jenhujrl24v5e32px49m5mymuyfcs7hme39d",
    balance: 15029n,
  },
  {
    address: "qzxttsfd07405l5aapvz2uaw506v89n9353lvk02r3",
    balance: 15000n,
  },
  {
    address: "p0mn3m58u03lfsr3nq86l4y2y8n5k8lypvunn70e3kecens8lnmtvmj5e2lkk",
    balance: 13856n,
  },
  {
    address: "pvwhjauadwprv2qeesd949gmn47f7uh85xh5w4mkm9z0x4xhvvulxc6r634h6",
    balance: 13720n,
  },
  {
    address: "qq2vdh4cdt3jw3tqnwfthll2kfm5vrw3f53sszqp9s",
    balance: 10631n,
  },
  {
    address: "pd4arlx7jpu2y0krz6slwav2ucr90an54c5c9u6drf5rvx84tgvjkx84y0u4p",
    balance: 10275n,
  },
  {
    address: "qrcp50vskkwvk7f3r7cphvzhkgm0c6nn7cxkkqx8wu",
    balance: 10005n,
  },
  {
    address: "pdsd2d974fc7x6cgm4tp0s338lq7s4qx0zydf6mcnusax8ptsg0q674velyzy",
    balance: 9991n,
  },
  {
    address: "qr0jkq5qzkh2geamaqlqcpf9gcuvfygw0ulcf4xlcq",
    balance: 9400n,
  },
  {
    address: "pwxdaaa7kufay4nydrav4nt5hxefy55fcs4hfwec3hzp6yaprl067n6huprgk",
    balance: 8903n,
  },
  {
    address: "pw5exr5cmkxa4ysf2m9jnws03fs3h72nteujjh0e8wgymzp6kmc9jthp8h3zs",
    balance: 7513n,
  },
  {
    address: "pv73gvm7ft00xwttrgt87nz6pjrc2nh39nwpp4s8plumsn2sf2hrz3pj9cf6j",
    balance: 7484n,
  },
  {
    address: "qz0g9zh443y8cvpan9gq7u3zg9l3qmf2yvh6xmhu43",
    balance: 7451n,
  },
  {
    address: "p0pyy7lv38ayrrccekf0rga4vv9p6w4ls8q69n362r3gvyppxk7ru0wen27a7",
    balance: 7247n,
  },
  {
    address: "pwrefl0sct9lhecxmuledamxxcrpqwg9af03twns69dqaktfw99pxe24sff2r",
    balance: 6700n,
  },
  {
    address: "pwlku8ykmuv6dcpnxflvyeagdrytpayu390pl0h8csh5vjm6ejkq72fjjszqs",
    balance: 5448n,
  },
  {
    address: "qrtrva8ps58908qxl7m3x8jt2u9gezrujq758dh3xz",
    balance: 5255n,
  },
  {
    address: "pwtdx08qgy87sdtetyukq5y5zg409zkgfsgckujv2ckytdvmqn9mstg04wx7q",
    balance: 4668n,
  },
  {
    address: "qq8pdsp6k2lsepvagg6emndpz2n9rum7lsj5l2zm65",
    balance: 4491n,
  },
  {
    address: "qz6lladu42ue6tjt33nhhy3s4jfsnm2nzq8vm4mqvw",
    balance: 3967n,
  },
  {
    address: "pwx66udf00qae83tak0k4g2tecvcnrfuaq2z7ewjrpvpmt6zw3f3c75rgzk3y",
    balance: 3813n,
  },
  {
    address: "p02vqggw46gstupjeqw5jdewd9szc4relfyq48t3rq6p22r45d05cp9y4u9la",
    balance: 3622n,
  },
  {
    address: "qz98tf5yn8m4j30xu0vrdns2487g5twyzc7h5s9jwm",
    balance: 3500n,
  },
  {
    address: "qzdc9gmwserzacgprrrq63utugucvnuujvmm7t6dqf",
    balance: 3298n,
  },
  {
    address: "pdfa5zzg8fwl3mvz3npuksvey4m57564dj339hf0a7vddvykplg2sf0qzyuv7",
    balance: 3264n,
  },
  {
    address: "pd04ztz4yvkm2jk68x3sfmdaz3ct36vxgutymmg8pq9ll5huzuut6e8awaa7z",
    balance: 2276n,
  },
  {
    address: "qp9qs5cx2r5xr562emjrz5h9fh386x70sgmtyf8ct6",
    balance: 2098n,
  },
  {
    address: "qp6zsr40rvgqljmtjpz6hszsj5sw5ukhhcjz2lcpsl",
    balance: 2000n,
  },
  {
    address: "qpryp8lhlsewthc7e97uk0cfxdk9wculjgqu28jpff",
    balance: 1881n,
  },
  {
    address: "pvmmjn96erdp5m9s8mupk5q4365nemvz5js3s5c6fxuu5u6lawkqqyrn8f5mz",
    balance: 1194n,
  },
  {
    address: "qpaznhlvlrlut40hdmnpgvzywfmh4cncsy8gjxyegq",
    balance: 999n,
  },
  {
    address: "qqu0qtsfzndka7zvyl0hhw988x0kfm9vhyz0nqsykx",
    balance: 999n,
  },
  {
    address: "qzuxg44prtksgvdluatkeagmgyydne6qf5l3smklag",
    balance: 999n,
  },
  {
    address: "qzwsnr4axt34vkyefp50v6cy66rzxt8vus3pm3hysn",
    balance: 999n,
  },
  {
    address: "qqlrhx9j09eaga5a9455p9wca4xdwjrllvr2s3u67g",
    balance: 989n,
  },
  {
    address: "p0ad5me8etwxqwqvv6cgsqq6g9946q7d006d0rh3edj8rtcd3ugs7g2uzhqvc",
    balance: 823n,
  },
  {
    address: "qpzn3sek4xq6vgpnkucrrlsu4h9jgm35qgxq9nwa8u",
    balance: 754n,
  },
  {
    address: "qqe08y5253esrjlwlh99z9usnsr66jxud58lqx2yfq",
    balance: 677n,
  },
  {
    address: "qqjazy9flx8gfuqv2jyw2zh8twclnnpyluc292vfsq",
    balance: 499n,
  },
  {
    address: "qzasx97emrgsd8rls5epeny2yyznycjmhqaryk72f9",
    balance: 458n,
  },
  {
    address: "qzenu3023zj60a8nae0keycrld3mgn0l9gsyf27rgg",
    balance: 400n,
  },
  {
    address: "qz0te8m2gy08524fq794hcnm7rnpjj0lhyf4rw6099",
    balance: 325n,
  },
  {
    address: "qrs043y9me8rkx930d2u4n6g9x9muzv74urqmzmadx",
    balance: 300n,
  },
  {
    address: "qz2rzgv3sah25pjfem7gn5m8mda3pu7rr5m8me8n23",
    balance: 298n,
  },
  {
    address: "pw0qualc63ly2ukdxrts32zjqshmpe7ttpnrqqfjgpqlqvzxh28w2aue4epyv",
    balance: 264n,
  },
  {
    address: "qqsyh24zp98nax6t3dc6cmulmrh08qcsqs8d575mae",
    balance: 223n,
  },
  {
    address: "qqnfryc2eud8tsgrtk4j2nzepyyr832swya3c8z7s7",
    balance: 210n,
  },
  {
    address: "pvwckrkte0azpr7j7qkvp6jyv9kw3szl04ejxpsnehu8hhunrykywl9ek67pj",
    balance: 207n,
  },
  {
    address: "qpe52efw6xufq4trgvtu97s5uct7gzz5hgettsddum",
    balance: 200n,
  },
  {
    address: "qpwrfkrtfrdhmku99zg9w2ka3y8wxs5p9q5h3r0tv8",
    balance: 200n,
  },
  {
    address: "qpeydls8utefhyzx4nekdjvnuhklk7nf6sc9lqwj9z",
    balance: 199n,
  },
  {
    address: "qrg8xmhfqytlfmt7nwk44cymp2cv3y5kksyqmw20mn",
    balance: 194n,
  },
  {
    address: "qpds3nv5kllxmw4cgdershk4m4ajcjpcqufkwstd7u",
    balance: 150n,
  },
  {
    address: "qq3demz430vlvsmafquxxw8rudxr8dkm6vgdvyzngq",
    balance: 140n,
  },
  {
    address: "pvja237qlz8m0hqzts4qt3u4hr85lmhrhksvatulafmysmwg8dfxyte2myevz",
    balance: 125n,
  },
  {
    address: "qzhhhm6daarh4mprtwdw8umj7dr3jtncfvrww36zy4",
    balance: 101n,
  },
  {
    address: "qpcj9p2r5zjqv67wsvf2mf4jsgwezsfs4qpuc0cx94",
    balance: 100n,
  },
  {
    address: "qpdah7k0pxmqu4sj8t0r4mjvxxwv4f0t7vtytfvnay",
    balance: 100n,
  },
  {
    address: "qqva2ej4670m48x6t0n742qnszzs2p67auk3hzqnay",
    balance: 100n,
  },
  {
    address: "qzh2hrpufp72jkux8ncdcluvvz3l9ytzqglldmzvez",
    balance: 100n,
  },
  {
    address: "qzlw6ne4yj7fwmdnlk3hdgdqug36ckl5xqt5s6m9wv",
    balance: 100n,
  },
  {
    address: "qzn7gzgcje9q6cp3gsgfa47w860cnwej0y5zu7vvm0",
    balance: 100n,
  },
];
export const OLANDO_HOLDERS: ConcentrationHolder[] = [
  {
    address: "prr3cu20vnv2ervxl8fwpkuu3yxrflk98cqfy4xxuf",
    balance: 888888888788888929n,
  },
  {
    address: "qzw6wvpr8qrstzv3qxdm2l6pr2rrgklukgquc6v2p0",
    balance: 53000000n,
  },
  {
    address: "qpwrfkrtfrdhmku99zg9w2ka3y8wxs5p9q5h3r0tv8",
    balance: 15653113n,
  },
  {
    address: "qq9u9uqvzxyl7qkkmpnxutada2ugdz9w4qppvuafmm",
    balance: 15000135n,
  },
  {
    address: "qrc6nn50dw4dlezcr59m6fwpqwg4f2t30yfr6yeys7",
    balance: 9025029n,
  },
  {
    address: "p09egh3x2dpkkpgwkh7kfv6hq59z8g8j02hln50999stspsgeyfdu0gdndyhq",
    balance: 2292721n,
  },
  {
    address: "qzj5ww5g0x4sv6j4p8zx5w69hcqytl64jv8pcm8adh",
    balance: 2000025n,
  },
  {
    address: "qregec6wps5ylh605skaggz26y38834gy5u4cfdpys",
    balance: 2000019n,
  },
  {
    address: "qqx7ausr73045qjun902d0rvc7vsc6m3tvch7et269",
    balance: 1000009n,
  },
  {
    address: "qrnxtat33taeq4tgtqr32dtkns6mpwuccyet5y9pg2",
    balance: 14423n,
  },
  {
    address: "qpx0luscd0rl0r6z87y9q0uvev82hphfku6keh3ct8",
    balance: 10154n,
  },
  {
    address: "qqmldcxsh955fxh5gv54ssk7nacf37gpcyqp3xg2zm",
    balance: 3519n,
  },
  {
    address: "qqx77whvxqw8gv6cm99g9297svktkx59eqeuwxmnnz",
    balance: 104n,
  },
  {
    address: "qre4trc3gvaqtx5lka9arhn2d6m4t757fc7kpcshvm",
    balance: 48n,
  },
  {
    address: "qqd7pwcw59dapfdm8yfcyf95u8kdz2le4vkczeq56x",
    balance: 21n,
  },
  {
    address: "qpa0lakhpksuu2qgl4lmrfw7h6mt9pqnp5nqwd6u37",
    balance: 17n,
  },
  {
    address: "qpfemweprgp06evn7eg72mwm76w58mejfcj24yas63",
    balance: 17n,
  },
  {
    address: "qpkngevwse0zvp6tjc0d4zp2mdpguajqvvqpaag9mx",
    balance: 17n,
  },
  {
    address: "qpn68slwnqfmdnd3wrp7qr8rahs56ld8d5zn0g8uva",
    balance: 17n,
  },
  {
    address: "qppuphlj0dcrwyqd0n9hdhxe4e8js2ncls9h0p8u8v",
    balance: 17n,
  },
  {
    address: "qpryp8lhlsewthc7e97uk0cfxdk9wculjgqu28jpff",
    balance: 17n,
  },
  {
    address: "qpt77rcjcrf63rg6vxmh7kz56ld5g3fe9cs8mp5x2f",
    balance: 17n,
  },
  {
    address: "qpwnsp255nqzwftgf6jkfmzfnlfahw9x0q2mg5x9ns",
    balance: 17n,
  },
  {
    address: "qq0njgp4mk7pyul86fncterrujx5c7n7l56sk6nhlw",
    balance: 17n,
  },
  {
    address: "qq24d74g8rx5jc3qmvt4wrxsauefx63ggy8t427xh6",
    balance: 17n,
  },
  {
    address: "qq4gac90z4ew0xz9x74f0lmp9ept227cxca375mmvh",
    balance: 17n,
  },
  {
    address: "qq7g6re8nrmlprygv79y7wqd5dlj9msspu0huuzh39",
    balance: 17n,
  },
  {
    address: "qqdgqdqrta5hh7y9m2kds67pv4dchhwmhgtezxntn9",
    balance: 17n,
  },
  {
    address: "qqsat2py84zlwt2acsuq8qv7zvjegqtw9ysqw5q3yw",
    balance: 17n,
  },
  {
    address: "qqskpdey8n5frl4fj0tp7tz25wyst52375lks5u5au",
    balance: 17n,
  },
  {
    address: "qr5mx53du5jwzk3qlqqk2hv47v00rx4pcctuuan043",
    balance: 17n,
  },
  {
    address: "qr93etu29xs9aqz8fqqcfpgkzrp6424n4s7wyendmc",
    balance: 17n,
  },
  {
    address: "qr9yt3fkrqmv5wrhm93vv695g5ce7er57c5dynq3z0",
    balance: 17n,
  },
  {
    address: "qrmh6adm2638h0evc6rm269g5g2dk5qm5sujv8j4ja",
    balance: 17n,
  },
  {
    address: "qrxn8ee6ja676dcdg2dmfghqqpl30f25w5krldx3tz",
    balance: 17n,
  },
  {
    address: "qz0eyg6k57am4fef4xl0xem752qu8z94lgp9rzff5u",
    balance: 17n,
  },
  {
    address: "qz0j66lwkktgmt6c5jk8zud9n89g0qggasx5tv8g33",
    balance: 17n,
  },
  {
    address: "qz3a2smjhsr0shh0ydlp7608z55040pv0cu8ydrf6m",
    balance: 17n,
  },
  {
    address: "qz4gj2pq45a8yz4045lwxuw83mefgsx7jvyv5cldhh",
    balance: 17n,
  },
  {
    address: "qz5clgr3djxj76v2wf2p5ptpa0ajyxjj4sve2cf2hw",
    balance: 17n,
  },
  {
    address: "qz5nv23wc93q3glj2vn0nhsazdrn0jt9dva6zt0haz",
    balance: 17n,
  },
  {
    address: "qzfgq2jhtf28s409le285cnlxd2dqvkevgkl3uj2zv",
    balance: 17n,
  },
  {
    address: "qzgq2ppd724ylyqsdvesujv323rg7trdxcw7nhknup",
    balance: 17n,
  },
  {
    address: "qzgq6yhfkeqlw9q5rhx7r4lcsnudyccctqj6fs4y0v",
    balance: 17n,
  },
  {
    address: "qzll5myg6tcdels0747dw9ulfdvkxjdsjc9prr7k0l",
    balance: 17n,
  },
  {
    address: "qzmzhmnddl2dtpfqzrp48g0v7d6j59dfks7upfs0y0",
    balance: 17n,
  },
  {
    address: "qzxdsk7ycw70mmuqfpktv80gg6fz56u4h5r462np3d",
    balance: 17n,
  },
  {
    address: "qzn2rgnae8ucn0ums2xkeqfqkaqedlmxfy7puak49p",
    balance: 7n,
  },
];
