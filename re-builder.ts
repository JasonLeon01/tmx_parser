import { group } from 'console';
import * as fs from 'fs';
import * as xml2js from 'xml2js';

const tmxFilePath = 'tilemaps/example.tmx';
const jsonFilePath = 'parser.json';
const outputFilePath = 're-builder.tmx';

interface Property {
    name: string;
    type: string;
    value: string | number;
}
interface Event {
    id: number;
    type: string;
    pos: [number, number];
    gid: number;
    size: [number, number];
    properties: Property[];
    file: [string, number, number];
}
interface Group {
    groupid: string;
    groupname: string;
    events: Event[];
}

const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

const data = fs.readFileSync(tmxFilePath, 'utf8');

xml2js.parseString(data, (err: Error | null, result) => {
    if (err) {
        console.error(err);
        return;
    }

    result.map.objectgroup = [];

    if (jsonData.groups) {
        jsonData.groups.forEach((group: Group) => {
            const events = [] as Event[];
            const groupid = group.groupid;
            const groupname = group.groupname;
            group.events.forEach((event: Event) => {
                const properties = [] as Property[];
                event.properties.forEach((property: Property) => {
                    properties.push({
                        name: property.name,
                        type: '',
                        value: property.value
                    });
                });
                events.push({
                    id: event.id,
                    type: event.type,
                    pos: event.pos,
                    gid: event.gid,
                    size: event.size,
                    properties: properties,
                    file: event.file
                });
            });
            result.map.objectgroup.push({ 
                $: {
                    id: groupid,
                    name: groupname
                },
                object: events.map((event: Event) => {
                    return {
                        $: {
                            id: event.id,
                            type: event.type,
                            gid: event.gid,
                            x: event.pos[0] * 32,
                            y: event.pos[1] * 32,
                            width: event.size[0],
                            height: event.size[1]
                        },
                        properties: {
                            property: event.properties.map((property: Property) => ({
                                $: {
                                    name: property.name,
                                    type: typeof property.value === 'string' ? null : (Number.isInteger(property.value) ? 'int' : 'float'),
                                    value: property.value
                                }
                            }))
                        }
                    }
                })
            });
        });
    }

    const builder = new xml2js.Builder();
    const updateXml = builder.buildObject(result);

    fs.writeFileSync(outputFilePath, updateXml);
    console.log('Re-built tmx file:', outputFilePath);
});